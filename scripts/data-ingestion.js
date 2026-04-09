/**
 * Data Ingestion Script
 * Processes Procus data (PDFs, Excel sheets, documents) and stores as vector embeddings in Supabase
 * 
 * Usage: npm run ingest:data -- --source ./data/products.json --type products
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { OpenaiService } = require('../src/services/openai');
const { MongoDBService } = require('../src/services/mongodb');
const logger = require('../src/utils/logger');

dotenv.config();

/**
 * Example product data structure
 */
const SAMPLE_PRODUCTS = [
  {
    id: 'KIVO001',
    name: 'Kivo 4-in-1 Gari',
    description: 'Premium processed cassava flour blend with added vegetables',
    category: 'Gari',
    prices: {
      wholesale: 45,
      retail: 55,
    },
    regions: ['Greater Accra', 'Kumasi', 'Tema', 'Takoradi', 'Sekondi'],
    tags: ['cassava', 'gari', 'staple'],
  },
  {
    id: 'KIVO002',
    name: 'Kivo Pepper Spice',
    description: 'Blend of African pepper and spices for authentic seasoning',
    category: 'Spices',
    prices: {
      wholesale: 30,
      retail: 38,
    },
    regions: ['Greater Accra', 'Kumasi'],
    tags: ['pepper', 'spice', 'seasoning'],
  },
  {
    id: 'KIVO003',
    name: 'Kivo Ginger Powder',
    description: 'Pure ginger powder with no artificial additives',
    category: 'Spices',
    prices: {
      wholesale: 25,
      retail: 32,
    },
    regions: ['All Regions'],
    tags: ['ginger', 'wellness', 'natural'],
  },
];

/**
 * Sample HR policies for ingestion
 */
const SAMPLE_HR_DOCS = [
  {
    id: 'HR001',
    title: 'Leave Policy',
    content: `Procus Leave Policy:
- Annual Leave: 15 working days
- Sick Leave: 5 working days
- Compassionate Leave: 3 working days
- Public Holiday: As per Ghana Labour Law`,
    category: 'HR',
  },
  {
    id: 'HR002',
    title: 'Uniform Request Procedure',
    content: `To request branded aprons for market activations:
1. Submit request form to Team Lead
2. HR approval (based on budget)
3. Collection from Tema warehouse or direct delivery
4. Expected turnaround: 5 business days`,
    category: 'HR',
  },
];

class DataIngestionManager {
  constructor() {
    this.openaiService = new OpenaiService();
    this.mongoService = new MongoDBService();
  }

  /**
   * Convert CSV to structured format
   * This is a placeholder - you would connect to actual CSV parsing
   */
  async processCSV(filePath) {
    logger.info(`Processing CSV file: ${filePath}`);
    // TODO: Implement CSV parsing logic
    return [];
  }

  /**
   * Convert Excel to structured format
   */
  async processExcel(filePath) {
    logger.info(`Processing Excel file: ${filePath}`);
    // TODO: Implement Excel parsing logic
    // You might use 'xlsx' npm package
    return [];
  }

  /**
   * Process PDF documents
   */
  async processPDF(filePath) {
    logger.info(`Processing PDF file: ${filePath}`);
    // TODO: Implement PDF extraction
    // You might use 'pdf-parse' or 'pdfjs-dist'
    return [];
  }

  /**
   * Create embeddings and store in MongoDB
   */
  async createAndStoreEmbeddings(documents, type = 'general') {
    logger.info(`Creating embeddings for ${documents.length} documents...`);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const doc of documents) {
      try {
        // Create text representation for embedding
        const textToEmbed = `${doc.name || doc.title}\n${doc.description || doc.content}`;

        // Generate embedding
        const embedding = await this.openaiService.createEmbedding(textToEmbed);

        // Store in MongoDB
        const stored = await this.mongoService.storeDocumentEmbedding(
          {
            content: doc.description || doc.content,
            metadata: {
              type,
              originalId: doc.id,
              name: doc.name || doc.title,
              category: doc.category || type,
              timestamp: new Date().toISOString(),
            },
          },
          embedding
        );

        if (stored) {
          results.success++;
          logger.info(`✓ Stored embedding for: ${doc.name || doc.title}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to store: ${doc.name || doc.title}`);
        }

        // Rate limiting: OpenAI has strict rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${doc.name}: ${error.message}`);
        logger.error(`Failed to process document: ${doc.name}`, error);
      }
    }

    return results;
  }

  /**
   * Ingest sample data (for testing)
   */
  async ingestSampleData() {
    logger.info('Starting sample data ingestion...\n');

    // Ingest products
    logger.info('📦 Ingesting sample products...');
    const productResults = await this.createAndStoreEmbeddings(
      SAMPLE_PRODUCTS,
      'product'
    );
    logger.info(`Products: ${productResults.success} success, ${productResults.failed} failed\n`);

    // Ingest HR documents
    logger.info('📋 Ingesting sample HR documents...');
    const hrResults = await this.createAndStoreEmbeddings(
      SAMPLE_HR_DOCS,
      'hr_policy'
    );
    logger.info(`HR Docs: ${hrResults.success} success, ${hrResults.failed} failed\n`);

    // Summary
    const totalSuccess = productResults.success + hrResults.success;
    const totalFailed = productResults.failed + hrResults.failed;

    logger.info('=== INGESTION COMPLETE ===');
    logger.info(`Total Success: ${totalSuccess}`);
    logger.info(`Total Failed: ${totalFailed}`);

    if (productResults.errors.length > 0) {
      logger.warn('Product errors:', productResults.errors);
    }
    if (hrResults.errors.length > 0) {
      logger.warn('HR errors:', hrResults.errors);
    }

    return {
      products: productResults,
      hr: hrResults,
    };
  }

  /**
   * Process custom data file
   */
  async processDataFile(filePath, type = 'general') {
    if (!fs.existsSync(filePath)) {
      logger.error(`File not found: ${filePath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();

    let documents = [];

    switch (ext) {
      case '.json':
        documents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        break;
      case '.csv':
        documents = await this.processCSV(filePath);
        break;
      case '.xlsx':
        documents = await this.processExcel(filePath);
        break;
      case '.pdf':
        documents = await this.processPDF(filePath);
        break;
      default:
        logger.error(`Unsupported file type: ${ext}`);
        return;
    }

    logger.info(`Loaded ${documents.length} documents from ${filePath}`);
    const results = await this.createAndStoreEmbeddings(documents, type);

    logger.info(`Results: ${results.success} success, ${results.failed} failed`);
    return results;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const manager = new DataIngestionManager();

    // Connect to MongoDB
    await manager.mongoService.connect();

    // Check command line arguments
    const args = process.argv.slice(2);
    const sourceIndex = args.indexOf('--source');
    const typeIndex = args.indexOf('--type');

    if (sourceIndex !== -1 && args[sourceIndex + 1]) {
      // Process specified file
      const filePath = args[sourceIndex + 1];
      const type = typeIndex !== -1 ? args[typeIndex + 1] : 'general';
      await manager.processDataFile(filePath, type);
    } else {
      // Run with sample data
      logger.info('No source file specified. Running with sample data...\n');
      await manager.ingestSampleData();
    }

    logger.info('\n✅ Data ingestion complete!');
    await manager.mongoService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error during ingestion:', error);
    process.exit(1);
  }
}

main();

module.exports = { DataIngestionManager };
