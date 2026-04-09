/**
 * Procus Copilot - WhatsApp Bot Server
 * Main entry point for the AI assistant serving Procus staff
 */

const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { OpenaiService } = require('./services/openai');
const { MongoDBService } = require('./services/mongodb');
const { TwilioService } = require('./services/twilio');
const { SYSTEM_PROMPTS } = require('./config/prompts');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize services
const openaiService = new OpenaiService();
const mongoService = new MongoDBService();
const twilioService = new TwilioService();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * WhatsApp Message Handler
 * POST /whatsapp - Receives messages from Twilio
 */
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body; // Text message from user
  const senderPhoneNumber = req.body.From; // User's WhatsApp number
  const messageCount = req.body.NumMedia || 0; // Check if message has attachments

  logger.info(`Message received from ${senderPhoneNumber}: ${incomingMsg}`);

  const twiml = new MessagingResponse();

  try {
    // 1. Detect user context (Sales Rep, Warehouse Manager, HR, etc.)
    const userContext = await detectUserContext(senderPhoneNumber);

    // 2. Select appropriate system prompt based on context
    const systemPrompt = selectSystemPrompt(userContext);

    // 3. Check if query requires real-time data lookup
    const requiresDataLookup = shouldPerformDataLookup(incomingMsg);

    let aiResponse;

    if (requiresDataLookup) {
      // Use OpenAI Function Calling for database queries
      aiResponse = await openaiService.queryWithFunctionCalling({
        query: incomingMsg,
        systemPrompt,
        mongoService: mongoService,
        functions: buildAvailableFunctions(userContext),
      });
    } else {
      // Standard conversational response
      aiResponse = await openaiService.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: incomingMsg },
        ],
        temperature: 0.7,
      });
    }

    // 4. Split long responses for WhatsApp character limit
    const responses = splitLongMessage(aiResponse);

    responses.forEach((response) => {
      twiml.message(response);
    });

    logger.info(`Response sent to ${senderPhoneNumber}`);
  } catch (error) {
    logger.error('Error processing WhatsApp message:', error);
    twiml.message(
      '❌ Sorry, I encountered an error processing your request. Please try again or contact support.'
    );
  }

  // Send response back to Twilio
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      openai: openaiService.isHealthy() ? '✓' : '✗',
      mongodb: mongoService.isHealthy() ? '✓' : '✗',
      twilio: twilioService.isHealthy() ? '✓' : '✗',
    },
  });
});

/**
 * Analytics Endpoint (for dashboard)
 */
app.get('/analytics', async (req, res) => {
  try {
    const stats = await mongoService.getConversationStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Utility Functions
 */

/**
 * Detect user's department/role from phone number
 * In production, this would query a user database
 */
async function detectUserContext(phoneNumber) {
  // TODO: Query Supabase user table to get user's department
  // For now, returning default context
  return {
    role: 'general', // Default to general company assistant - can be: sales_rep, warehouse_manager, marketing, hr, finance, general
    department: 'general',
    name: 'User', // Would fetch from DB
  };
}

/**
 * Select appropriate system prompt based on user role
 */
function selectSystemPrompt(userContext) {
  const prompts = SYSTEM_PROMPTS;

  switch (userContext.role) {
    case 'warehouse_manager':
      return prompts.WAREHOUSE_MANAGER_PROMPT;
    case 'marketing':
      return prompts.MARKETING_PROMPT;
    case 'hr':
      return prompts.HR_PROMPT;
    case 'finance':
      return prompts.FINANCE_PROMPT;
    case 'sales_rep':
      return prompts.SALES_REP_PROMPT;
    case 'general':
    default:
      return prompts.GENERAL_COMPANY_PROMPT;
  }
}

/**
 * Determine if message requires real-time database lookup
 */
function shouldPerformDataLookup(message) {
  const lookupKeywords = [
    'inventory',
    'stock',
    'price',
    'how many',
    'available',
    'in stock',
    'do we have',
    'fulfill',
    'check',
  ];

  return lookupKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
}

/**
 * Build function definitions for OpenAI function calling
 */
function buildAvailableFunctions(userContext) {
  const functions = [];

  // Common functions for all users
  functions.push({
    name: 'search_product_info',
    description: 'Search for Procus product information including prices and specs',
    parameters: {
      type: 'object',
      properties: {
        product_name: {
          type: 'string',
          description: 'Name of the Kivo product',
        },
        product_code: {
          type: 'string',
          description: 'SKU or product code',
        },
      },
      required: ['product_name'],
    },
  });

  // Warehouse-specific functions (available to warehouse managers and general users)
  if (userContext.role === 'warehouse_manager' || userContext.role === 'general') {
    functions.push({
      name: 'check_inventory',
      description: 'Check real-time inventory levels for a product',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
          warehouse_location: { type: 'string' },
        },
        required: ['product_id'],
      },
    });

    functions.push({
      name: 'get_restock_status',
      description: 'Get pending restock orders and expected delivery dates',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string' },
        },
      },
    });
  }

  // Finance-specific functions (available to finance team and general users)
  if (userContext.role === 'finance' || userContext.role === 'general') {
    functions.push({
      name: 'get_sales_data',
      description: 'Retrieve sales data for analysis',
      parameters: {
        type: 'object',
        properties: {
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          region: { type: 'string' },
        },
      },
    });
  }

  return functions;
}

/**
 * Split long messages to respect WhatsApp character limits
 */
function splitLongMessage(message, maxLength = 1600) {
  if (message.length <= maxLength) {
    return [message];
  }

  const messages = [];
  let currentMessage = '';

  message.split('\n').forEach((line) => {
    if ((currentMessage + line + '\n').length > maxLength) {
      if (currentMessage) messages.push(currentMessage);
      currentMessage = line + '\n';
    } else {
      currentMessage += line + '\n';
    }
  });

  if (currentMessage) messages.push(currentMessage);

  return messages;
}

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Start Server
 */
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoService.connect();

    app.listen(PORT, () => {
      logger.info(`\n✅ Procus Copilot is running on port ${PORT}`);
      logger.info(`📱 WhatsApp endpoint: http://localhost:${PORT}/whatsapp`);
      logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
      logger.info(
        `\n⚠️  Make sure your Twilio webhook is configured to: https://your-ngrok-url/whatsapp\n`
      );
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
