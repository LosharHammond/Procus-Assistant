/**
 * Supabase Service
 * Handles vector operations and data persistence
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

class SupabaseService {
  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    this.adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Store conversation for logging and analytics
   */
  async storeConversation(phoneNumber, userMessage, botResponse) {
    try {
      const { data, error } = await this.client
        .from('conversations')
        .insert([
          {
            phone_number: phoneNumber,
            user_message: userMessage,
            bot_response: botResponse,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        logger.error('Error storing conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Supabase insert error:', error);
      return false;
    }
  }

  /**
   * Vector search for RAG
   */
  async vectorSearch(queryEmbedding, limit = 5) {
    try {
      const { data, error } = await this.client.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: limit,
      });

      if (error) {
        logger.error('Vector search error:', error);
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Supabase RPC error:', error);
      return [];
    }
  }

  /**
   * Get product information
   */
  async getProductInfo(productName) {
    try {
      const { data, error } = await this.client
        .from('products')
        .select('*')
        .ilike('name', `%${productName}%`)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        logger.error('Error fetching product:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Supabase query error:', error);
      return null;
    }
  }

  /**
   * Get inventory for a product
   */
  async getInventory(productId, warehouse) {
    try {
      const { data, error } = await this.client
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('warehouse', warehouse)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching inventory:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Supabase query error:', error);
      return null;
    }
  }

  /**
   * Get all warehouses
   */
  async getWarehouses() {
    try {
      const { data, error } = await this.client
        .from('warehouses')
        .select('id, name, location');

      if (error) {
        logger.error('Error fetching warehouses:', error);
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Supabase query error:', error);
      return [];
    }
  }

  /**
   * Store document embeddings for RAG
   */
  async storeDocumentEmbedding(document, embedding) {
    try {
      const { data, error } = await this.adminClient
        .from('documents')
        .insert([
          {
            content: document.content,
            metadata: document.metadata,
            embedding,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        logger.error('Error storing embedding:', error);
        return false;
      }

      logger.info('Document embedding stored successfully');
      return true;
    } catch (error) {
      logger.error('Supabase insert error:', error);
      return false;
    }
  }

  /**
   * Get conversation statistics for analytics
   */
  async getConversationStats() {
    try {
      const { data, error } = await this.client
        .from('conversations')
        .select('*', { count: 'exact' });

      if (error) {
        logger.error('Error fetching stats:', error);
        return { totalConversations: 0, error: true };
      }

      return {
        totalConversations: data.length,
        lastUpdated: new Date().toISOString(),
        error: false,
      };
    } catch (error) {
      logger.error('Supabase query error:', error);
      return { totalConversations: 0, error: true };
    }
  }

  /**
   * Create a user if not exists
   */
  async createUserIfNotExists(phoneNumber, userData) {
    try {
      const { data: existingUser } = await this.client
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (existingUser) {
        return existingUser;
      }

      const { data, error } = await this.client
        .from('users')
        .insert([
          {
            phone_number: phoneNumber,
            name: userData.name || 'User',
            department: userData.department || 'sales',
            role: userData.role || 'staff',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('Error creating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Supabase operation error:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  isHealthy() {
    return !!this.client;
  }
}

module.exports = { SupabaseService };
