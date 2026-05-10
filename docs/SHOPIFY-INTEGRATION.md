# Shopify Integration Guide

Learn how to install and configure Sent with your Shopify store.

## Prerequisites

Before starting, ensure you have:
- [Created a Twilio account](./TWILIO-SETUP.md)
- [Installed the Sent app locally](../README.md)
- A Shopify store (development or production)

## Installation Steps

### 1. Start the Development Server

```bash
npm run dev
```

Your app will be available at `http://localhost:5173`

### 2. Create a Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app
3. Set the App URL to your local tunnel (e.g., `https://your-tunnel.ngrok.io`)
4. Add the following redirect URLs:
   - `https://your-tunnel.ngrok.io/auth`
   - `https://your-tunnel.ngrok.io/auth/callback`

### 3. Configure Environment Variables

Add your Shopify credentials to `.env`:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-tunnel.ngrok.io
```

### 4. Install the App on Your Store

1. Go to your Shopify Partner Dashboard
2. Select your app
3. Click "Test your app"
4. Choose your development store
5. Complete the OAuth flow

## OAuth Flow

When a merchant installs your app:

1. **Authorization Request** - Shopify redirects to `/auth`
2. **Permission Grant** - Merchant approves permissions
3. **Callback** - Shopify redirects to `/auth/callback`
4. **Token Exchange** - App exchanges code for access token
5. **Shop Record Created** - Your shop is saved in the database

## Webhook Configuration

Sent automatically configures the following webhooks:

| Webhook | Endpoint | Purpose |
|---------|----------|---------|
| `orders/create` | `/webhook/order` | Send order confirmations |
| `checkouts/update` | `/webhook/checkout` | Track abandoned carts |

### Manual Webhook Setup (if needed)

```bash
# Using Shopify CLI
shopify webhook trigger --topic orders/create --address https://your-app.com/webhook/order
```

## App Configuration

### Required Scopes

Your app needs these Shopify permissions:

- `read_orders` - Access order data
- `read_products` - Access product information
- `read_customers` - Access customer phone numbers

### App Extension (Optional)

To add a dashboard link in Shopify Admin:

1. Go to Partner Dashboard → Extensions
2. Create an Admin Link extension
3. Set the target URL to: `https://your-app.com/dashboard?shop={shop}`

## Testing the Integration

### 1. Verify OAuth Flow

1. Install the app from your Partner Dashboard
2. You should be redirected to the settings page
3. Enter your Twilio credentials
4. Save and verify the connection

### 2. Test Webhooks

Send a test order:

```bash
curl -X POST https://your-app.com/webhook/order \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/create" \
  -d '{
    "id": 12345,
    "email": "customer@example.com",
    "phone": "+1234567890",
    "total_price": "99.99"
  }'
```

### 3. Verify Dashboard

1. Navigate to `/dashboard?shop=your-shop.myshopify.com`
2. You should see:
   - Message statistics
   - Recent message history
   - Feature toggles

## Troubleshooting

### OAuth Error: "Invalid redirect_uri"

- Ensure redirect URLs match exactly in Shopify Partner Dashboard
- Check that `SHOPIFY_APP_URL` is set correctly
- Verify no trailing slashes in URLs

### Webhooks Not Receiving

- Check that your app is publicly accessible (not localhost)
- Verify HMAC signature validation is working
- Review webhook logs in Shopify Partner Dashboard

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate deploy`

## Next Steps

- [Configure your Dashboard](./DASHBOARD-GUIDE.md)
- [Review the API Reference](./API.md)
- [Set up message templates](./TWILIO-SETUP.md#message-templates)

---

**Previous:** [Twilio Setup](./TWILIO-SETUP.md)
**Next:** [Dashboard Guide](./DASHBOARD-GUIDE.md)
