/**
 * MongoDB Service
 * Handles all interactions with MongoDB Atlas (vector storage, data persistence)
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Define Schemas
const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, unique: true, required: true },
  name: String,
  email: String,
  department: String,
  role: { type: String, default: 'staff' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true, index: true },
  description: String,
  category: { type: String, index: true },
  sku: { type: String, unique: true },
  wholesalePrice: Number,
  retailPrice: Number,
  shelfLifeDays: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const inventorySchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  warehouseId: mongoose.Schema.Types.ObjectId,
  warehouseName: String,
  quantityBoxes: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 50 },
  lastCountedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  location: String,
  address: String,
  managerName: String,
  contactPhone: String,
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  phoneNumber: String,
  userMessage: { type: String, required: true },
  botResponse: { type: String, required: true },
  sentiment: String,
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});

const documentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
  embedding: [Number], // Array of numbers for vector storage
  documentType: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

// Add text index for embedding similarity search
documentSchema.index({ embedding: '2dsphere' });

const restockOrderSchema = new mongoose.Schema({
  productId: String,
  warehouseId: mongoose.Schema.Types.ObjectId,
  quantityOrdered: Number,
  orderDate: { type: Date, default: Date.now },
  expectedDeliveryDate: Date,
  status: { type: String, default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now },
});

// Define Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Document = mongoose.model('Document', documentSchema);
const RestockOrder = mongoose.model('RestockOrder', restockOrderSchema);

class MongoDBService {
  constructor() {
    this.connected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (this.connected) return;

      logger.info('Connecting to MongoDB Atlas...');

      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DATABASE || 'procus-copilot',
        maxPoolSize: 10,
      });

      this.connected = true;
      logger.info('✓ Connected to MongoDB Atlas');
    } catch (error) {
      logger.error('MongoDB connection error:', error.message || error);
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.connected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('MongoDB disconnection error:', error);
    }
  }

  /**
   * Store conversation for logging and analytics
   */
  async storeConversation(phoneNumber, userMessage, botResponse) {
    try {
      const conversation = new Conversation({
        phoneNumber,
        userMessage,
        botResponse,
      });

      await conversation.save();
      return true;
    } catch (error) {
      logger.error('Error storing conversation:', error);
      return false;
    }
  }

  /**
   * Vector similarity search for RAG
   * Uses simple Euclidean distance for now
   */
  async vectorSearch(queryEmbedding, limit = 5) {
    try {
      // MongoDB doesn't have native vector search in free tier
      // Using manual distance calculation with top limit
      const documents = await Document.find().limit(limit * 3);

      // Calculate similarity scores
      const results = documents
        .map((doc) => ({
          ...doc.toObject(),
          similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      logger.error('Vector search error:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (!a || !b) return 0;

    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get product information
   */
  async getProductInfo(productName) {
    try {
      const product = await Product.findOne({
        name: { $regex: productName, $options: 'i' },
      });

      return product ? product.toObject() : null;
    } catch (error) {
      logger.error('Error fetching product:', error);
      return null;
    }
  }

  /**
   * Get inventory for a product
   */
  async getInventory(productId, warehouse = null) {
    try {
      const query = { productId };
      if (warehouse) query.warehouseName = warehouse;

      const inventory = await Inventory.find(query);
      return inventory.map((inv) => inv.toObject());
    } catch (error) {
      logger.error('Error fetching inventory:', error);
      return [];
    }
  }

  /**
   * Get all warehouses
   */
  async getWarehouses() {
    try {
      const warehouses = await Warehouse.find().select('_id name location');
      return warehouses.map((w) => w.toObject());
    } catch (error) {
      logger.error('Error fetching warehouses:', error);
      return [];
    }
  }

  /**
   * Store document embeddings for RAG
   */
  async storeDocumentEmbedding(document, embedding) {
    try {
      const doc = new Document({
        content: document.content,
        metadata: document.metadata,
        embedding,
      });

      await doc.save();
      logger.info('Document embedding stored successfully');
      return true;
    } catch (error) {
      logger.error('Error storing embedding:', error);
      return false;
    }
  }

  /**
   * Get conversation statistics for analytics
   */
  async getConversationStats() {
    try {
      const totalConversations = await Conversation.countDocuments();
      const lastUpdated = new Date().toISOString();

      return {
        totalConversations,
        lastUpdated,
        error: false,
      };
    } catch (error) {
      logger.error('Error fetching stats:', error);
      return { totalConversations: 0, error: true };
    }
  }

  /**
   * Create a user if not exists
   */
  async createUserIfNotExists(phoneNumber, userData) {
    try {
      let user = await User.findOne({ phoneNumber });

      if (user) {
        return user.toObject();
      }

      user = new User({
        phoneNumber,
        name: userData.name || 'User',
        department: userData.department || 'sales',
        role: userData.role || 'staff',
      });

      await user.save();
      return user.toObject();
    } catch (error) {
      logger.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  isHealthy() {
    return this.connected && mongoose.connection.readyState === 1;
  }
}

module.exports = {
  MongoDBService,
  User,
  Product,
  Inventory,
  Warehouse,
  Conversation,
  Document,
  RestockOrder,
};
