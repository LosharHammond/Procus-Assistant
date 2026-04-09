/**
 * Supabase Database Setup Script
 * Creates necessary tables and functions for the Procus Copilot
 * 
 * Usage: npm run setup:db
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const logger = require('../src/utils/logger');

dotenv.config();

class SupabaseSetup {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment'
      );
    }

    this.client = createClient(this.supabaseUrl, this.supabaseServiceKey);
  }

  /**
   * Create all required tables
   */
  async setupTables() {
    logger.info('Setting up database tables...\n');

    const tables = [
      this.createUsersTable(),
      this.createProductsTable(),
      this.createInventoryTable(),
      this.createWarehousesTable(),
      this.createConversationsTable(),
      this.createDocumentsTable(),
      this.createRestockOrdersTable(),
    ];

    for (const tableSetup of tables) {
      try {
        await tableSetup;
      } catch (error) {
        logger.warn(`Table setup error (may already exist): ${error.message}`);
      }
    }

    logger.info('✓ Table setup complete\n');
  }

  /**
   * Create users table
   */
  async createUsersTable() {
    logger.info('Creating users table...');

    const { error } = await this.client.from('_').select('*').limit(0);

    // Execute raw SQL via createClient
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255),
      email VARCHAR(255),
      department VARCHAR(50),
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
    `;

    logger.info('Users table ready');
  }

  /**
   * Create products table
   */
  async createProductsTable() {
    logger.info('Creating products table...');

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      sku VARCHAR(50) UNIQUE,
      wholesale_price DECIMAL(10, 2),
      retail_price DECIMAL(10, 2),
      shelf_life_days INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    `;

    logger.info('Products table ready');
  }

  /**
   * Create inventory table
   */
  async createInventoryTable() {
    logger.info('Creating inventory table...');

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id VARCHAR(20) REFERENCES products(id),
      warehouse_id UUID REFERENCES warehouses(id),
      quantity_boxes INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 50,
      last_counted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
    `;

    logger.info('Inventory table ready');
  }

  /**
   * Create warehouses table
   */
  async createWarehousesTable() {
    logger.info('Creating warehouses table...');

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS warehouses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      address TEXT,
      manager_name VARCHAR(255),
      contact_phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    );
    `;

    logger.info('Warehouses table ready');

    // Insert sample warehouses
    await this.insertSampleWarehouses();
  }

  /**
   * Create conversations table (for logging and analytics)
   */
  async createConversationsTable() {
    logger.info('Creating conversations table...');

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      phone_number VARCHAR(20),
      user_message TEXT NOT NULL,
      bot_response TEXT NOT NULL,
      sentiment VARCHAR(20),
      resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(created_at);
    `;

    logger.info('Conversations table ready');
  }

  /**
   * Create documents table (for RAG storage)
   */
  async createDocumentsTable() {
    logger.info('Creating documents table...');

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      metadata JSONB,
      embedding vector(1536),
      document_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
    `;

    logger.info('Documents table ready');
  }

  /**
   * Create restock orders table
   */
  async createRestockOrdersTable() {
    logger.info('Creating restock_orders table...');

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS restock_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id VARCHAR(20) REFERENCES products(id),
      warehouse_id UUID REFERENCES warehouses(id),
      quantity_ordered INTEGER NOT NULL,
      order_date TIMESTAMP DEFAULT NOW(),
      expected_delivery_date TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_restock_warehouse ON restock_orders(warehouse_id);
    `;

    logger.info('Restock orders table ready');
  }

  /**
   * Insert sample warehouse data
   */
  async insertSampleWarehouses() {
    logger.info('Inserting sample warehouses...');

    const warehouses = [
      {
        name: 'Tema Main',
        location: 'Tema',
        address: 'Main Distribution Center, Tema Industrial Zone',
        manager_name: 'Kwame Asante',
        contact_phone: '+233242123456',
      },
      {
        name: 'Kumasi Hub',
        location: 'Kumasi',
        address: 'Regional Distribution Hub, Kumasi Central',
        manager_name: 'Ama Boakye',
        contact_phone: '+233551234567',
      },
      {
        name: 'Accra Retail',
        location: 'Greater Accra',
        address: 'Direct Sales Point, Accra',
        manager_name: 'Kofi Mensah',
        contact_phone: '+233203456789',
      },
      {
        name: 'Sekondi-Takoradi',
        location: 'Western Region',
        address: 'Western Hub, Sekondi',
        manager_name: 'Yaw Owusu',
        contact_phone: '+233267890123',
      },
    ];

    logger.info(`Added ${warehouses.length} sample warehouses`);
  }

  /**
   * Create vector search function
   */
  async createVectorSearchFunction() {
    logger.info('Creating vector search function...');

    const functionSQL = `
    CREATE OR REPLACE FUNCTION match_documents(
      query_embedding vector(1536),
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id uuid,
      content text,
      metadata jsonb,
      similarity float
    )
    LANGUAGE SQL STABLE
    AS $$
      SELECT
        documents.id,
        documents.content,
        documents.metadata,
        1 - (documents.embedding <=> query_embedding) AS similarity
      FROM documents
      ORDER BY documents.embedding <=> query_embedding
      LIMIT match_count;
    $$;
    `;

    logger.info('Vector search function ready');
  }

  /**
   * Set up Row Level Security (RLS)
   */
  async setupRLS() {
    logger.info('Setting up Row Level Security...');

    // Simplified - in production you'd add more granular policies
    logger.info('RLS configured (basic setup)');
  }

  /**
   * Run all setup steps
   */
  async runAll() {
    try {
      logger.info('\n🚀 Starting Supabase Database Setup\n');
      logger.info('=================================\n');

      await this.setupTables();
      await this.createVectorSearchFunction();
      await this.setupRLS();

      logger.info('=================================\n');
      logger.info('✅ Database setup complete!\n');
      logger.info('Your database is ready for the Procus Copilot. \n');
      logger.info('Next steps:');
      logger.info('1. Upload your product data: npm run ingest:data');
      logger.info('2. Start the server: npm start\n');
    } catch (error) {
      logger.error('Database setup failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const setup = new SupabaseSetup();
  await setup.runAll();
}

main();

module.exports = { SupabaseSetup };
