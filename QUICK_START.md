# Quick Start Guide - Procus Copilot

Get the Procus Copilot running in 5 minutes!

---

## 🎯 Before You Start

You'll need credentials for:
- ✅ OpenAI (API Key)
- ✅ Supabase (URL + Keys)
- ✅ Twilio (Account SID + Auth Token + WhatsApp Number)

Don't have them? Get them here:
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Supabase Free Project](https://supabase.com)
- [Twilio Free Tier](https://www.twilio.com/try-twilio)

---

## ⚡ 5-Minute Setup

### 1. Clone & Install (1 minute)

```bash
git clone https://github.com/LosharHammond/Procus-Assistant.git
cd procus-assistant
npm install
```

### 2. Configure Environment (1 minute)

```bash
cp .env.example .env

# Edit .env in your editor and add your credentials:
# - OPENAI_API_KEY
# - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
```

### 3. Set Up Database (1 minute)

```bash
npm run setup:db
npm run ingest:data
```

### 4. Start Server (1 minute)

```bash
npm run dev
```

You'll see:
```
✅ Procus Copilot is running on port 3000
📱 WhatsApp endpoint: http://localhost:3000/whatsapp
```

### 5. Configure Twilio (1 minute)

In Twilio Dashboard:
1. WhatsApp Sandbox Settings
2. Paste this URL: `https://your-ngrok-url/whatsapp`
   (Get ngrok URL by running: `ngrok http 3000`)
3. Save

**Done!** Send a WhatsApp message to the sandbox number and start chatting.

---

## 🧪 Test It Out

### Send a message:
```
"Hello"
↓
"Hi! I'm the Procus Copilot. How can I help you today?"

"What is the price of Kivo Gari in Tema?"
↓
"Price: GHS 45/carton | Warehouse: Tema | Stock: 500 boxes available"

"Can you check inventory for Kivo Pepper?"
↓
"✓ Tema: 300 boxes | Kumasi: 150 boxes | Accra: 120 boxes"
```

---

## 📁 Project Files

```
procus-assistant/
├── src/
│   ├── server.js                 # Main WhatsApp bot
│   ├── services/
│   │   ├── openai.js            # AI engine
│   │   ├── supabase.js          # Database
│   │   └── twilio.js            # Messaging
│   ├── config/
│   │   └── prompts.js           # Brand voice
│   └── utils/
│       └── logger.js            # Logging
├── scripts/
│   ├── data-ingestion.js        # Import data
│   └── setup-supabase.js        # DB setup
├── data/
│   └── sample-products.json     # Sample data
├── .env.example                 # Config template
├── package.json
├── README.md                    # Full documentation
├── DEVELOPMENT.md              # Dev guide
├── DEPLOYMENT.md               # Production guide
├── API_DOCS.md                 # API reference
└── QUICK_START.md              # This file
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm test                # Run tests
npm run lint            # Check code quality

# Database
npm run setup:db        # Create tables
npm run ingest:data     # Import sample data

# Production
npm start                # Start server
npm run build            # Prepare for deployment
```

---

## 📚 Next Steps

1. **Understand the Architecture**
   👉 Read [README.md](README.md)

2. **Set Up for Development**
   👉 Read [DEVELOPMENT.md](DEVELOPMENT.md)

3. **Deploy to Production**
   👉 Read [DEPLOYMENT.md](DEPLOYMENT.md)

4. **Learn the API**
   👉 Read [API_DOCS.md](API_DOCS.md)

---

## 🆘 Troubleshooting

### "API key not found"
```bash
# Make sure .env is in the root directory
ls -la .env

# Check if variables are set
source .env
echo $OPENAI_API_KEY
```

### "Can't connect to Supabase"
```bash
# Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl $SUPABASE_URL/rest/v1/
```

### "Twilio webhook not working"
```bash
# Make sure ngrok is running
ngrok http 3000

# Check URL is in Twilio settings
# Webhook might be: https://your-ngrok-url/whatsapp
```

### "Messages not responding"
```bash
# Check server health
curl http://localhost:3000/health

# View logs
npm run dev  # See real-time logs
```

---

## 💡 Tips & Tricks

1. **Test Locally First**
   - Use ngrok to tunnel to localhost
   - Test changes immediately

2. **Use Sample Data**
   - `npm run ingest:data` loads test products
   - Query: "What is Kivo Gari?" to see it work

3. **Monitor OpenAI Usage**
   - Check [OpenAI API Usage](https://platform.openai.com/account/usage/overview)
   - Each message costs a few cents

4. **Set Different Prompts Per Role**
   - Edit `src/config/prompts.js` for different personas
   - Bot adapts to user department

5. **View Conversations**
   - All chats stored in Supabase
   - Use for training and improvement

---

## 🚀 Ready to Deploy?

Once working locally, deploy with:

```bash
# Heroku (simplest)
git push heroku main

# Or any other platform covered in DEPLOYMENT.md
```

---

## 📞 Support

- **Docs**: Check README, DEVELOPMENT, API_DOCS
- **Issues**: GitHub Issues on the repository
- **Email**: dev@procus.com

---

**Let's build something amazing for Procus! 🎉**
