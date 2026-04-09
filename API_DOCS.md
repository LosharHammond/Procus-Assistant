# API Documentation - Procus Copilot

## Overview

This document describes the endpoints and data structures for the Procus Copilot API.

---

## Base URL

**Development**: `http://localhost:3000`  
**Production**: `https://your-domain.com` (after deployment)

---

## Authentication

Current version uses **no authentication** for WhatsApp endpoint (Twilio handles verification).  
For dashboard/analytics, implement JWT tokens in future versions.

---

## Endpoints

### 1. WhatsApp Message Handler

**Endpoint**: `POST /whatsapp`

**Description**: Receives WhatsApp messages from Twilio webhook

**Request Body** (from Twilio):
```xml
Body: "What is the price of Kivo Gari?"
From: "whatsapp:+233XXXXXXXXXX"
To: "whatsapp:+1234567890"
NumMedia: 0
```

**Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Price: GHS 45/carton in Tema warehouse</Message>
</Response>
```

**Status Codes**:
- `200` - Message processed successfully
- `500` - Internal server error

**Error Response**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>❌ Sorry, I encountered an error. Please try again.</Message>
</Response>
```

---

### 2. Health Check

**Endpoint**: `GET /health`

**Description**: Check if all services are running

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-04-09T10:30:45.123Z",
  "services": {
    "openai": "✓",
    "supabase": "✓",
    "twilio": "✓"
  }
}
```

**Status Codes**:
- `200` - All services operational
- `503` - One or more services down

---

### 3. Analytics

**Endpoint**: `GET /analytics`

**Description**: Get conversation statistics and operational metrics

**Response**:
```json
{
  "totalConversations": 1250,
  "lastUpdated": "2024-04-09T10:30:45.123Z",
  "error": false,
  "breakdown": {
    "byRole": {
      "sales_rep": 450,
      "warehouse_manager": 350,
      "marketing": 200,
      "hr": 150,
      "finance": 100
    },
    "byDate": [
      {
        "date": "2024-04-09",
        "count": 120
      }
    ]
  }
}
```

**Status Codes**:
- `200` - Successfully retrieved
- `500` - Database error

---

## OpenAI Function Calling

### Available Functions

#### 1. `search_product_info`

Search for product information including prices and specs.

**Parameters**:
```json
{
  "product_name": "Kivo Gari",
  "product_code": "KIVO001"
}
```

**Response Example**:
```json
{
  "productName": "Kivo 4-in-1 Gari",
  "productCode": "KIVO001",
  "price": "GHS 45.00",
  "description": "Premium cassava flour blend",
  "availability": true,
  "warehouses": ["Tema", "Kumasi", "Accra"]
}
```

#### 2. `check_inventory`

Real-time inventory level for a product at a specific warehouse.

**Parameters**:
```json
{
  "product_id": "KIVO001",
  "warehouse_location": "Tema"
}
```

**Response Example**:
```json
{
  "productId": "KIVO001",
  "quantity": 500,
  "warehouse": "Tema",
  "reorderLevel": 50,
  "lastUpdated": "2024-04-09T10:00:00Z"
}
```

#### 3. `get_restock_status`

Pending restock orders and expected delivery dates.

**Parameters**:
```json
{
  "product_id": "KIVO001"
}
```

**Response Example**:
```json
{
  "productId": "KIVO001",
  "pendingOrders": 2,
  "expectedDeliveries": [
    {
      "date": "2024-04-15",
      "quantity": 300
    },
    {
      "date": "2024-04-22",
      "quantity": 200
    }
  ]
}
```

#### 4. `get_sales_data`

Sales data for analysis and reporting.

**Parameters**:
```json
{
  "start_date": "2024-04-01",
  "end_date": "2024-04-09",
  "region": "Greater Accra"
}
```

**Response Example**:
```json
{
  "startDate": "2024-04-01",
  "endDate": "2024-04-09",
  "region": "Greater Accra",
  "totalSales": "GHS 125,400",
  "topProducts": [
    "Kivo 4-in-1 Gari",
    "Kivo Pepper Spice"
  ],
  "growthPercentage": 12.5
}
```

---

## Supabase RPC Functions

### `match_documents`

Vector similarity search for RAG retrieval.

**Query Parameters**:
```sql
SELECT * FROM match_documents(
  query_embedding => [0.1, 0.2, ...],
  match_count => 5
)
```

**Response**:
```json
[
  {
    "id": "uuid",
    "content": "Document content...",
    "metadata": { "type": "product", "category": "Gari" },
    "similarity": 0.95
  }
]
```

---

## Data Schemas

### User Schema
```json
{
  "id": "uuid",
  "phone_number": "+233XXXXXXXXXX",
  "name": "John Doe",
  "email": "john@procus.com",
  "department": "sales / warehouse / marketing / hr / finance",
  "role": "staff / manager / admin",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-04-09T10:30:00Z"
}
```

### Product Schema
```json
{
  "id": "KIVO001",
  "name": "Kivo 4-in-1 Gari",
  "description": "Premium cassava flour blend with vegetables",
  "category": "Gari",
  "sku": "KIVO-4IN1-001",
  "wholesale_price": 45.00,
  "retail_price": 55.00,
  "shelf_life_days": 540,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Inventory Schema
```json
{
  "id": "uuid",
  "product_id": "KIVO001",
  "warehouse_id": "uuid",
  "quantity_boxes": 500,
  "reorder_level": 50,
  "last_counted_at": "2024-04-09T08:00:00Z",
  "updated_at": "2024-04-09T10:30:00Z"
}
```

### Conversation Schema
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "phone_number": "+233XXXXXXXXXX",
  "user_message": "What is the price?",
  "bot_response": "Price is GHS 45...",
  "sentiment": "neutral / positive / negative",
  "resolved": true,
  "created_at": "2024-04-09T10:30:00Z"
}
```

### Document Schema (RAG)
```json
{
  "id": "uuid",
  "content": "Document text content...",
  "metadata": {
    "type": "product / hr_policy / sales_guide",
    "category": "specifics",
    "source": "original_file.pdf"
  },
  "embedding": [0.1, 0.2, 0.3, ...], // 1536 dimensions
  "document_type": "agreement / manual / data",
  "created_at": "2024-04-09T10:30:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": "product_name is required"
}
```

### 404 Not Found
```json
{
  "error": "Endpoint not found",
  "path": "/invalid-endpoint"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "requestId": "req-12345"
}
```

---

## Rate Limiting

**Current Limits** (subject to OpenAI/Supabase tiers):
- OpenAI: As per your API tier
- Supabase: As per your project tier
- Twilio: As per your account tier

**Headers in Response**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1712671445
```

---

## Webhooks

### Twilio Webhook Events

**Event**: Incoming WhatsApp Message

**Payload** (POST to `/whatsapp`):
```xml
AccountSid=ACxxxxxxxxxxxxxxxx
APIVersion=2010-04-01
Body=Message text here
From=whatsapp:%2B233XXXXXXXXXX
MediaContentType0=
MediaUrl0=
NumMedia=0
SmsMessageSid=SMxxxxxxxxxxxxxxxx
To=whatsapp:%2B1234567890
```

---

## Example Usage

### cURL

```bash
# Check health
curl http://localhost:3000/health

# Get analytics
curl http://localhost:3000/analytics
```

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/health');
const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/health')
print(response.json())
```

---

## Versioning

Current Version: **v1.0.0**

Planned Versions:
- **v1.1.0**: Multi-channel support (SMS, Telegram)
- **v2.0.0**: Advanced analytics & forecasting

---

## Support

For API issues:
- Check logs: `tail -f logs/error.log`
- Review health endpoint: `GET /health`
- Check Supabase dashboard for database issues
- Review OpenAI dashboard for API issues

---

**Last Updated**: April 2024
