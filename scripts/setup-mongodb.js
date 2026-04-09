/**
 * MongoDB Setup Script
 * Initializes MongoDB collections and indexes for the Procus Copilot
 * 
 * Usage: npm run setup:db
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('../src/utils/logger');
const {
  User,
  Product,
  Inventory,
  Warehouse,
  Conversation,
  Document,
  RestockOrder,
} = require('../src/services/mongodb');

dotenv.config();

class MongoDBSetup {
  constructor() {
    this.mongodbUri = process.env.MONGODB_URI;
    this.mongodbDatabase = process.env.MONGODB_DATABASE || 'procus-copilot';

    if (!this.mongodbUri) {
      throw new Error('Missing MONGODB_URI in environment');
    }
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      logger.info('Connecting to MongoDB Atlas...');

      await mongoose.connect(this.mongodbUri, {
        dbName: this.mongodbDatabase,
        maxPoolSize: 10,
      });

      logger.info('✓ Connected to MongoDB Atlas\n');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw new Error('Failed to connect to MongoDB');
    }
  }

  /**
   * Create all collections and indexes
   */
  async setupCollections() {
    logger.info('Setting up collections and indexes...\n');

    try {
      // User collection
      logger.info('Creating users collection...');
      await User.collection.createIndex({ phoneNumber: 1 }, { unique: true });
      logger.info('✓ Users collection ready');

      // Product collection
      logger.info('Creating products collection...');
      await Product.collection.createIndex({ id: 1 }, { unique: true });
      await Product.collection.createIndex({ name: 1 });
      await Product.collection.createIndex({ category: 1 });
      logger.info('✓ Products collection ready');

      // Inventory collection
      logger.info('Creating inventory collection...');
      await Inventory.collection.createIndex({ productId: 1 });
      await Inventory.collection.createIndex({ warehouseName: 1 });
      logger.info('✓ Inventory collection ready');

      // Warehouse collection
      logger.info('Creating warehouses collection...');
      await Warehouse.collection.createIndex({ name: 1 });
      logger.info('✓ Warehouses collection ready');

      // Conversation collection
      logger.info('Creating conversations collection...');
      await Conversation.collection.createIndex({ phoneNumber: 1 });
      await Conversation.collection.createIndex({ createdAt: 1 });
      logger.info('✓ Conversations collection ready');

      // Document collection (for RAG)
      logger.info('Creating documents collection...');
      await Document.collection.createIndex({ createdAt: 1 });
      logger.info('✓ Documents collection ready');

      // Restock Orders collection
      logger.info('Creating restock_orders collection...');
      await RestockOrder.collection.createIndex({ status: 1 });
      logger.info('✓ Restock Orders collection ready\n');
    } catch (error) {
      logger.warn('Collection setup warnings (may already exist):', error.message);
    }
  }

  /**
   * Insert sample warehouses
   */
  async insertSampleData() {
    logger.info('Inserting sample data...\n');

    try {
      // Check if warehouses already exist
      const warehouseCount = await Warehouse.countDocuments();

      if (warehouseCount === 0) {
        logger.info('Adding sample warehouses...');

        const sampleWarehouses = [
          {
            name: 'Tema Main',
            location: 'Tema',
            address: 'Main Distribution Center, Tema Industrial Zone',
            managerName: 'Kwame Asante',
            contactPhone: '+233242123456',
          },
          {
            name: 'Kumasi Hub',
            location: 'Kumasi',
            address: 'Regional Distribution Hub, Kumasi Central',
            managerName: 'Ama Boakye',
            contactPhone: '+233551234567',
          },
          {
            name: 'Accra Retail',
            location: 'Greater Accra',
            address: 'Direct Sales Point, Accra',
            managerName: 'Kofi Mensah',
            contactPhone: '+233203456789',
          },
          {
            name: 'Sekondi-Takoradi',
            location: 'Western Region',
            address: 'Western Hub, Sekondi',
            managerName: 'Yaw Owusu',
            contactPhone: '+233267890123',
          },
        ];

        await Warehouse.insertMany(sampleWarehouses);
        logger.info(`✓ Added ${sampleWarehouses.length} sample warehouses\n`);
      } else {
        logger.info(
          `✓ Warehouses already exist (${warehouseCount} found)\n`
        );
      }

      // Check if products already exist
      const productCount = await Product.countDocuments();

      if (productCount === 0) {
        logger.info('Adding sample products...');

        const sampleProducts = [
          {
            id: 'KIVO001',
            name: 'Kivo 4-in-1 Gari',
            description:
              'Premium processed cassava flour blend with added vegetables',
            category: 'Gari',
            sku: 'KIVO-4IN1-500G',
            wholesalePrice: 45,
            retailPrice: 55,
            shelfLifeDays: 540,
          },
          {
            id: 'KIVO002',
            name: 'Kivo Pepper Spice',
            description:
              'Blend of African pepper and spices for authentic seasoning',
            category: 'Spices',
            sku: 'KIVO-PEPPER-100G',
            wholesalePrice: 30,
            retailPrice: 38,
            shelfLifeDays: 360,
          },
          {
            id: 'KIVO003',
            name: 'Kivo Ginger Powder',
            description:
              'Pure ginger powder with no artificial additives',
            category: 'Spices',
            sku: 'KIVO-GINGER-100G',
            wholesalePrice: 25,
            retailPrice: 32,
            shelfLifeDays: 360,
          },
        ];

        await Product.insertMany(sampleProducts);
        logger.info(`✓ Added ${sampleProducts.length} sample products\n`);
      } else {
        logger.info(`✓ Products already exist (${productCount} found)\n`);
      }
    } catch (error) {
      logger.warn('Sample data insertion warning:', error.message);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Disconnection error:', error);
    }
  }

  /**
   * Run all setup steps
   */
  async runAll() {
    try {
      logger.info('\n🚀 Starting MongoDB Setup\n');
      logger.info('=================================\n');

      await this.connect();
      await this.setupCollections();
      await this.insertSampleData();

      logger.info('=================================\n');
      logger.info('✅ MongoDB setup complete!\n');
      logger.info('Your database is ready for the Procus Copilot.\n');
      logger.info('Next steps:');
      logger.info('1. Upload your product data: npm run ingest:data');
      logger.info('2. Start the server: npm start\n');

      await this.disconnect();
    } catch (error) {
      logger.error('Database setup failed:', error);
      await this.disconnect();
      process.exit(1);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const setup = new MongoDBSetup();
  await setup.runAll();
}

main();

module.exports = { MongoDBSetup };
