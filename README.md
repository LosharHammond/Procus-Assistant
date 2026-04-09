# Procus Copilot - Internal AI Assistant

An AI-powered WhatsApp bot designed for fast-moving consumer goods (FMCG) operations at Procus, featuring real-time inventory checks, product pricing, and intelligent query responses using RAG (Retrieval-Augmented Generation).

## 🎯 Key Features

- **WhatsApp Integration**: Reach field agents where they are - no app downloads needed
- **Role-Based Assistance**: Tailored responses for Sales Reps, Warehouse Managers, HR, Marketing, and Finance
- **Real-Time Data Lookup**: Inventory checks, pricing queries, and restock status via function calling
- **Vector Search (RAG)**: Intelligent document retrieval from product catalogs, HR policies, and market data
- **LocalLanguage Support**: English + Twi code-switching for natural Ghanaian market communication
- **Analytics Dashboard**: Track conversations and operational insights

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js / Express |
| **AI Engine** | OpenAI GPT-4o + Claude |
| **Database (Vector Store)** | MongoDB Atlas + Mongoose |
| **messaging** | Twilio WhatsApp API |
| **Embeddings** | OpenAI text-embedding-3-small |

---

## 📦 Project Structure

```
procus-assistant/
├── src/
│   ├── server.js                 # Main WhatsApp bot server
│   ├── services/
│   │   ├── openai.js            # OpenAI API integration
│   │   ├── mongodb.js           # Vector DB and data queries
│   │   └── twilio.js            # WhatsApp message handling
│   ├── config/
│   │   └── prompts.js           # Role-specific system prompts
│   └── utils/
│       └── logger.js            # Logging utility
├── scripts/
│   ├── data-ingestion.js        # Process PDFs/Excel → Embeddings
│   └── setup-mongodb.js         # Database initialization
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1️⃣ Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Accounts & API Keys**:
  - OpenAI API key (GPT-4o access)
  - MongoDB Atlas account (free tier available)
  - Twilio account + WhatsApp Sandbox
  - ngrok (for local testing)

### 2️⃣ Installation

```bash
# Clone the repository
git clone https://github.com/LosharHammond/Procus-Assistant.git
cd procus-assistant

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # Add your API keys here
```

### 3️⃣ Environment Setup

Update `.env` with your credentials:

```env
# TWILIO
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# OPENAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# MONGODB ATLAS
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/procus-copilot
MONGODB_DATABASE=procus-copilot

# APP
NODE_ENV=development
PORT=3000
```

### 4️⃣ Database Setup

```bash
# Create collections and indexes in MongoDB
npm run setup:db

# Ingest sample data (products, HR policies)
npm run ingest:data

# Or ingest your own data:
npm run ingest:data -- --source ./data/products.json --type products
```

### 5️⃣ Start the Server

```bash
# Development mode (with nodemon auto-restart)
npm run dev

# Production
npm start
```

You should see:
```
✅ Procus Copilot is running on port 3000
📱 WhatsApp endpoint: http://localhost:3000/whatsapp
❤️  Health check: http://localhost:3000/health
```

---

## 🔗 Twilio WhatsApp Setup

### Step 1: Create Twilio Project
1. Go to [Twilio Console](https://console.twilio.com)
2. Create a new project
3. Enable WhatsApp integration
4. Get your Account SID and Auth Token

### Step 2: Set Up WhatsApp Sandbox
1. Go to **Messaging → Sandbox**
2. Follow steps to get a temporary sandbox phone number
3. Test the number using the provided method

### Step 3: Expose Local Server (for testing)

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok (creates public URL)
ngrok http 3000
```

You'll see output like:
```
Forwarding     https://12345-67-89-abc.ngrok.io → http://localhost:3000
```

### Step 4: Configure Twilio Webhook
1. In Twilio Console, go to WhatsApp Sandbox settings
2. Paste your ngrok URL in "When a message comes in":
   ```
   https://12345-67-89-abc.ngrok.io/whatsapp
   ```
3. Save

### Step 5: Test the Bot
Send a message from the sandbox number to your WhatsApp. The bot will respond!

---

## 💬 Use Cases

### Sales Representative
```
👤 Sales Rep: "What's the current wholesale price for Kivo 4-in-1 Gari in Kumasi?"
🤖 Bot: "Price: GHS 45/carton | Minimum order: 10 carts | Stock available in Kumasi Hub: 200 boxes ✓"
```

### Warehouse Manager
```
👤 Manager: "Check inventory: Can we fulfill a 500-box order of Kivo Ginger Powder today?"
🤖 Bot: "✓ Tema: 300 boxes | Kumasi: 150 boxes | Accra: 120 boxes
         Can fulfill 500-box order within 6hrs. Recommend Tema + Kumasi shipment."
```

### Marketing Team
```
👤 Marketing: "Draft a Twi-English radio ad script for Kivo Ginger Powder"
🤖 Bot: "[Draft] 🎤 RADIO (30s):
         'Kivo Ginger Powder - Ɔtɔ sɛ abɔᴐ! Pure ginger, no harmful additives...'
         Available at all major markets. Kivo - Quality You Can Trust."
```

### HR / New Hire
```
👤 New Hire: "What is the procedure for requesting branded aprons for market activations?"
🤖 Bot: "✓ Here's the process:
         1. Fill request form (link below)
         2. Team Lead approval
         3. HR confirms budget
         4. 5-business day turnaround
         Form: [link]"
```

---

## 🔒 Security Best Practices

1. **Never commit `.env`** - It's in `.gitignore`
2. **Rotate API Keys regularly** - Especially MongoDB connection strings
3. **Use MongoDB access controls** - Restrict database access by IP whitelist
4. **Rate Limiting** - Implement on Twilio to prevent abuse
5. **Input Validation** - Sanitize user queries before passing to OpenAI
6. **HTTPS Only** - Always use HTTPS in production

---

## 📊 Monitoring & Analytics

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-04-09T10:30:45.123Z",
  "services": {
    "openai": "✓",
    "mongodb": "✓",
    "twilio": "✓"
  }
}
```

### Analytics API
```bash
GET /analytics
```

Returns conversation statistics and operational metrics.

---

## 📚 Documentation

### System Prompts
Each role has a customized system prompt in `src/config/prompts.js`:
- **SALES_REP_PROMPT**: Product info, pricing, market insights
- **WAREHOUSE_MANAGER_PROMPT**: Inventory tracking, logistics
- **MARKETING_PROMPT**: Ad copywriting, campaign content
- **HR_PROMPT**: Policies, onboarding, procedures
- **FINANCE_PROMPT**: Sales analytics, forecasting

### Function Calling
OpenAI function calling enables real-time database queries. Available functions:
- `search_product_info` - Retrieve product specs
- `check_inventory` - Real-time stock levels
- `get_restock_status` - Pending orders & delivery dates
- `get_sales_data` - Sales analytics & charts

### Data Ingestion
The `scripts/data-ingestion.js` script:
1. Reads CSV/Excel/PDF/JSON files
2. Creates embeddings using OpenAI API
3. Stores in Supabase vector table
4. Enables RAG retrieval for queries

---

## 🛠️ Advanced Setup

### Deploying to Production

#### Option 1: Heroku (Recommended for quick start)
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create procus-copilot

# Set environment variables
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set TWILIO_ACCOUNT_SID=...
# ... (repeat for all env vars)

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Option 2: AWS Lambda + API Gateway
```bash
# Install Serverless Framework
npm install -g serverless

# Configure AWS credentials
aws configure

# Deploy
serverless deploy
```

#### Option 3: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t procus-copilot .
docker run -p 3000:3000 --env-file .env procus-copilot
```

---

## 🔧 Troubleshooting

### Issue: "API key not found"
```
Solution: Ensure OPENAI_API_KEY is set in .env
Run: source .env && echo $OPENAI_API_KEY
```

### Issue: "Can't connect to MongoDB"
```bash
Solution: Check MONGODB_URI in .env file
Make sure MongoDB cluster is running and IP whitelist includes your IP
```

### Issue: "Twilio webhook not receiving messages"
```
Solution: 
1. Check ngrok URL is correctly set in Twilio Console
2. ngrok tunnel might have expired - restart ngrok
3. Verify firewall allows port 3000
```

### Issue: "Rate limit exceeded"
```
Solution:
- Wait before retrying
- Implement exponential backoff
- Upgrade OpenAI plan for higher limits
```

---

## 📈 Future Roadmap

- [ ] **Multi-Channel Support**: SMS, Telegram, WhatsApp Business API
- [ ] **Advanced Analytics**: Sales forecasting, trend prediction
- [ ] **Mobile App**: Native iOS/Android app for field agents
- [ ] **Integration with ERP**: Sync with Procus existing systems
- [ ] **Voice Support**: WhatsApp voice message transcription
- [ ] **Multilingual**: Add more local languages (Ga, Ewe, Hausa)
- [ ] **Custom Model Training**: Fine-tune GPT on Procus data
- [ ] **Offline Mode**: Cache responses for areas with poor connectivity

---

## 📞 Support

For issues or questions:
- 📧 Email: dev@procus.com
- 🐛 GitHub Issues: [Report a bug](https://github.com/LosharHammond/Procus-Assistant/issues)
- 📚 Documentation: See `/docs` folder

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

**Made with ❤️ for Procus FMCG**