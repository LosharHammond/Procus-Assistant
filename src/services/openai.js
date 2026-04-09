/**
 * OpenAI Service
 * Handles all interactions with OpenAI API (GPT-4o, embeddings, etc.)
 */

const { OpenAI } = require('openai');
const logger = require('../utils/logger');

class OpenaiService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  /**
   * Send chat completion request
   */
  async chat({ messages, temperature = 0.7, maxTokens = 500 }) {
    try {
      logger.debug('Sending chat request to OpenAI...');

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI chat error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }

  /**
   * Chat with function calling for database queries
   */
  async queryWithFunctionCalling({
    query,
    systemPrompt,
    mongoService,
    functions,
  }) {
    try {
      logger.debug('Calling OpenAI with function calling...');

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ];

      // First call with function definitions
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        functions,
        function_call: 'auto',
        max_tokens: 500,
      });

      // If function was called, execute it
      if (response.choices[0].message.function_call) {
        return await this.executeFunctionCall(
          response.choices[0].message.function_call,
          mongoService,
          messages
        );
      }

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI function calling error:', error);
      throw new Error('Failed to process query with function calling');
    }
  }

  /**
   * Execute a function call from OpenAI
   */
  async executeFunctionCall(functionCall, mongoService, messages) {
    const functionName = functionCall.name;
    const args = JSON.parse(functionCall.arguments);

    logger.info(`Executing function: ${functionName}`, args);

    let functionResult;

    // Route to appropriate database function
    switch (functionName) {
      case 'search_product_info':
        functionResult = await this.searchProductInfo(
          args.product_name,
          args.product_code,
          mongoService
        );
        break;

      case 'check_inventory':
        functionResult = await this.checkInventory(
          args.product_id,
          args.warehouse_location,
          mongoService
        );
        break;

      case 'get_restock_status':
        functionResult = await this.getRestockStatus(
          args.product_id,
          mongoService
        );
        break;

      case 'get_sales_data':
        functionResult = await this.getSalesData(
          args.start_date,
          args.end_date,
          args.region,
          mongoService
        );
        break;

      default:
        functionResult = { error: `Unknown function: ${functionName}` };
    }

    // Call OpenAI again with function result
    messages.push({ role: 'assistant', content: functionCall });
    messages.push({
      role: 'function',
      name: functionName,
      content: JSON.stringify(functionResult),
    });

    const finalResponse = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 500,
    });

    return finalResponse.choices[0].message.content;
  }

  /**
   * Create embeddings for vector search
   */
  async createEmbedding(text) {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Embedding creation error:', error);
      throw new Error('Failed to create embedding');
    }
  }

  /**
   * Placeholder database query functions (to be implemented with MongoDB)
   */
  async searchProductInfo(productName, productCode, mongoService) {
    // TODO: Implement MongoDB query
    return {
      productName,
      productCode,
      price: 'GHS 50.00',
      description: 'Kivo 4-in-1 Gari',
    };
  }

  async checkInventory(productId, warehouseLocation, mongoService) {
    // TODO: Implement MongoDB query
    return {
      productId,
      quantity: 500,
      warehouse: warehouseLocation || 'Tema',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getRestockStatus(productId, mongoService) {
    // TODO: Implement MongoDB query
    return {
      productId,
      pendingOrders: 2,
      expectedDeliveries: ['2024-04-15'],
    };
  }

  async getSalesData(startDate, endDate, region, mongoService) {
    // TODO: Implement MongoDB query with analytics
    return {
      startDate,
      endDate,
      region: region || 'All Regions',
      totalSales: 'GHS 50,000.00',
      topProducts: ['Kivo Gari', 'Kivo 4-in-1'],
    };
  }

  /**
   * Health check
   */
  isHealthy() {
    return !!this.client;
  }
}

module.exports = { OpenaiService };
