# API Reference

Complete reference for Sent's REST API and webhook endpoints.

## Base URL

```
https://your-app.com
```

## Authentication

All API requests require authentication via Shopify OAuth. Include the shop domain as a query parameter:

```
?shop=your-shop.myshopify.com
```

## API Endpoints

### Dashboard Stats

Get messaging statistics for a shop.

**Endpoint:** `GET /api/dashboard/stats`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `shop` | string | Yes | Shop domain (e.g., `my-store.myshopify.com`) |

**Response:**
```json
{
  "messagesSentThisMonth": 45,
  "messagesDelivered": 43,
  "remainingQuota": 155,
  "deliveryRate": 95,
  "clickThroughRate": 12,
  "totalRecoveredOrders": 8,
  "totalRecoveredRevenue": 1250.00
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing shop parameter
- `404` - Shop not found

### Recent Messages

Get the last 20 messages sent for a shop.

**Endpoint:** `GET /api/dashboard/messages`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `shop` | string | Yes | Shop domain |

**Response:**
```json
[
  {
    "id": "msg_abc123",
    "type": "ABANDONED_CART",
    "phoneNumber": "***1234",
    "status": "DELIVERED",
    "clickCount": 2,
    "sentAt": "2024-01-15T14:30:00Z",
    "createdAt": "2024-01-15T14:30:00Z"
  }
]
```

### Update Feature Settings

Enable or disable messaging features.

**Endpoint:** `POST /api/dashboard/settings`

**Parameters (Form Data):**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `shopId` | string | Yes | Shop ID |
| `enableAbandonedCart` | boolean | No | Enable abandoned cart recovery |
| `enableOrderConfirmation` | boolean | No | Enable order confirmations |

**Response:**
```json
{
  "success": true
}
```

### Get Settings

Retrieve current feature settings.

**Endpoint:** `GET /api/dashboard/settings`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `shop` | string | Yes | Shop domain |

**Response:**
```json
{
  "enableAbandonedCart": true,
  "enableOrderConfirmation": true
}
```

### ROI Calculation

Get recovered revenue data.

**Endpoint:** `GET /api/roi`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `shop` | string | Yes | Shop domain |

**Response:**
```json
{
  "orderCount": 15,
  "totalRecovered": 2345.67
}
```

### Consent Management

Handle customer opt-out requests.

**Endpoint:** `POST /api/consent`

**Request Body:**
```json
{
  "shopId": "shop_abc123",
  "phoneNumber": "+1234567890",
  "consent": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent updated"
}
```

## Webhooks

Sent receives webhooks from Shopify for real-time events.

### Order Created

Triggered when a new order is placed.

**Endpoint:** `POST /webhook/order`

**Headers:**
| Header | Description |
|--------|-------------|
| `X-Shopify-Topic` | `orders/create` |
| `X-Shopify-Hmac-SHA256` | HMAC signature for verification |
| `X-Shopify-Shop-Domain` | Shop domain |

**Payload:**
```json
{
  "id": 123456789,
  "email": "customer@example.com",
  "phone": "+1234567890",
  "total_price": "99.99",
  "line_items": [
    {
      "title": "Product Name",
      "quantity": 1,
      "price": "99.99"
    }
  ],
  "customer": {
    "id": 987654321,
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response:**
- `200` - Webhook processed
- `204` - No action needed

### Checkout Updated

Triggered when a checkout is created or updated.

**Endpoint:** `POST /webhook/checkout`

**Headers:**
| Header | Description |
|--------|-------------|
| `X-Shopify-Topic` | `checkouts/update` |
| `X-Shopify-Hmac-SHA256` | HMAC signature |

**Payload:**
```json
{
  "id": "checkout_abc123",
  "token": "abc123def456",
  "email": "customer@example.com",
  "phone": "+1234567890",
  "line_items": [...],
  "abandoned_checkout_url": "https://shop.myshopify.com/checkouts/..."
}
```

### Webhook Verification

Verify webhook authenticity using HMAC:

```typescript
import crypto from 'crypto';

function verifyWebhook(body: string, hmac: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmac)
  );
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_SHOP` | 400 | Shop parameter is required |
| `SHOP_NOT_FOUND` | 404 | Shop not found in database |
| `INVALID_CREDENTIALS` | 401 | Twilio credentials invalid |
| `RATE_LIMITED` | 429 | Too many requests |
| `WEBHOOK_VERIFICATION_FAILED` | 401 | HMAC signature invalid |

## Rate Limits

- **API Requests**: 100 per minute per shop
- **Webhook Processing**: No limit
- **Message Sending**: 1 per second per shop

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://your-app.com';

async function getDashboardStats(shop: string) {
  const response = await fetch(
    `${API_BASE}/api/dashboard/stats?shop=${encodeURIComponent(shop)}`
  );
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Usage
const stats = await getDashboardStats('my-store.myshopify.com');
console.log(stats.messagesSentThisMonth);
```

### cURL

```bash
# Get stats
curl "https://your-app.com/api/dashboard/stats?shop=my-store.myshopify.com"

# Update settings
curl -X POST "https://your-app.com/api/dashboard/settings" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "shopId=shop_abc123&enableAbandonedCart=true"
```

### Python

```python
import requests

API_BASE = "https://your-app.com"

def get_messages(shop: str):
    response = requests.get(
        f"{API_BASE}/api/dashboard/messages",
        params={"shop": shop}
    )
    response.raise_for_status()
    return response.json()

messages = get_messages("my-store.myshopify.com")
```

## Testing

### Test Webhook Locally

Use ngrok to expose local server:

```bash
ngrok http 5173
```

Then configure the webhook URL in Shopify:
```
https://your-ngrok-url.ngrok.io/webhook/order
```

### Test API Endpoints

```bash
# Using HTTPie
http GET "https://your-app.com/api/dashboard/stats" shop=="my-store.myshopify.com"

# Using curl
curl -X GET "https://your-app.com/api/dashboard/stats?shop=my-store.myshopify.com"
```

## Related Documentation

- [Getting Started](./GETTING-STARTED.md)
- [Twilio Setup](./TWILIO-SETUP.md)
- [Shopify Integration](./SHOPIFY-INTEGRATION.md)
- [Dashboard Guide](./DASHBOARD-GUIDE.md)

---

**Previous:** [Dashboard Guide](./DASHBOARD-GUIDE.md)
**Next:** [Back to README](../README.md)
