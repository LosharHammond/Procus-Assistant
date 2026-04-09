# Development Guide - Procus Copilot

## 🔧 Development Setup

### 1. First-Time Setup

```bash
# Install Node modules
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your test credentials
# (Use sandbox keys, not production keys)
```

### 2. Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### 3. Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

---

## 📝 Adding New Features

### Adding a New User Role

1. **Create system prompt** in `src/config/prompts.js`:
```javascript
CUSTOM_ROLE_PROMPT: `You are the Procus Copilot assisting with [custom role]...`
```

2. **Update role detection** in `src/server.js`:
```javascript
case 'custom_role':
  return prompts.CUSTOM_ROLE_PROMPT;
```

3. **Add custom functions** if needed:
```javascript
if (userContext.role === 'custom_role') {
  functions.push({
    name: 'custom_function',
    description: 'Description',
    parameters: { ... }
  });
}
```

### Adding a New Function Call

1. **Define in `src/server.js`** `buildAvailableFunctions()`:
```javascript
functions.push({
  name: 'my_function',
  description: 'What it does',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string' }
    }
  }
});
```

2. **Implement in `src/services/openai.js`**:
```javascript
async executeFunctionCall(functionCall, supabaseClient, messages) {
  switch (functionName) {
    case 'my_function':
      functionResult = await this.myFunction(...);
      break;
  }
}

async myFunction(param1, supabaseClient) {
  // Implementation here
}
```

### Adding Database Queries

1. **Create table** in `scripts/setup-supabase.js`
2. **Add query method** in `src/services/supabase.js`
3. **Call from services** in appropriate handler

---

## 🧪 Testing Manually

### Test 1: Basic Chat
```
Send to bot: "Hello"
Expected: Greeting response with offer to help
```

### Test 2: Price Query (Sales Rep)
```
Send: "What is the price of Kivo Gari?"
Expected: Price extracted from vector search
```

### Test 3: Inventory Check (Warehouse)
```
Send: "Check inventory for Kivo Pepper"
Expected: Real-time inventory count via function calling
```

### Test 4: Multi-message Conversation
```
Send: "I want to order"
Send: "500 boxes of Kivo 4-in-1"
Expected: Bot maintains context across messages
```

---

## 🐛 Debugging

### Enable Debug Logging

```bash
# In .env
LOG_LEVEL=debug

# In terminal
LOG_LEVEL=debug npm run dev
```

### Check Service Health

```bash
curl http://localhost:3000/health
```

### View Supabase Logs

```bash
# In Supabase dashboard:
# Database → Logs → Query Performance
```

### Monitor OpenAI API Usage

```bash
# Track token usage:
# View in OpenAI dashboard → Usage → Tokens/Requests
```

---

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Response |
|--------|----------|----------|
| POST | `/whatsapp` | Twilio XML |
| GET | `/health` | JSON status |
| GET | `/analytics` | JSON stats |

### Internal Use

- Supabase Vector Search: `match_documents()`
- OpenAI Function Calling: Automatic via `queryWithFunctionCalling()`

---

## 📊 Data Models

### Users
```javascript
{
  id: UUID,
  phone_number: "+233...",
  name: "John",
  department: "sales",
  role: "sales_rep",
  created_at: Timestamp
}
```

### Products
```javascript
{
  id: "KIVO001",
  name: "Kivo 4-in-1 Gari",
  category: "Gari",
  wholesale_price: 45,
  retail_price: 55,
  shelf_life_days: 540
}
```

### Conversations
```javascript
{
  id: UUID,
  user_id: UUID,
  user_message: "...",
  bot_response: "...",
  created_at: Timestamp
}
```

### Documents (RAG)
```javascript
{
  id: UUID,
  content: "...",
  embedding: vectorArray,
  metadata: { type, category, ... }
}
```

---

## 🚀 Performance Tips

1. **Cache frequent queries** in Redis (future enhancement)
2. **Batch embeddings** to reduce API calls
3. **Use indexes** on frequently queried columns
4. **Limit vector search results** (default: 5 documents)
5. **Rate limit aggressively** for production

---

## 🔐 Security Checklist

- [ ] `.env` file in `.gitignore`
- [ ] API keys rotated regularly
- [ ] Supabase RLS policies enabled
- [ ] Input validation on all queries
- [ ] SQL injection prevention (using prepared statements)
- [ ] HTTPS in production
- [ ] Audit logging enabled
- [ ] Rate limiting configured

---

## 📦 Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database backups configured
- [ ] Error monitoring (Sentry) setup
- [ ] CDN for static assets (if needed)
- [ ] SSL certificates valid
- [ ] Twilio webhook HTTPS only
- [ ] API keys for production obtained
- [ ] Monitoring alerts configured

---

## 🆘 Common Issues

### Vector Search Returns No Results
- Check if embeddings were created: `SELECT COUNT(*) FROM documents`
- Verify query embedding format (should be float array)
- Try with different similarity threshold

### OpenAI Timeouts
- Check rate limits: https://platform.openai.com/account/rate-limits
- Reduce `max_tokens` if necessary
- Add retry logic with exponential backoff

### Supabase Connection Drops
- Check network connectivity
- Verify credentials haven't expired
- Increase connection pool size

---

## 📚 Useful Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [Express.js Guide](https://expressjs.com/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

**Last Updated**: April 2024
