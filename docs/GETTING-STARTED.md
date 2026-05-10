# Getting Started

Complete walkthrough to set up Sent - WhatsApp Automation for Shopify. This guide will take you from zero to sending your first WhatsApp message in about 15 minutes.

## Prerequisites

Before you begin, make sure you have:

### Required Accounts

1. **Shopify Partner Account**
   - Sign up free at [partners.shopify.com](https://partners.shopify.com)
   - Needed to create and test Shopify apps

2. **Twilio Account**
   - Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Free tier includes trial credits for testing
   - Required for WhatsApp messaging API

3. **Development Store**
   - Create one in your Shopify Partner dashboard
   - Used for testing without affecting live stores
   - Can add fake products and orders

### Development Environment

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| Node.js | 18+ | Runtime | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Package manager | Included with Node.js |
| ngrok | Latest | Public tunnel | [ngrok.com](https://ngrok.com/) |
| Git | Latest | Version control | [git-scm.com](https://git-scm.com/) |

Verify your installation:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Any recent version
ngrok --version   # Should be installed
```

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd sent
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- React Router for routing
- Prisma for database
- Twilio SDK for messaging
- All other dependencies

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your text editor:

```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Shopify (we'll fill these in the next section)
SHOPIFY_API_KEY="your-api-key"
SHOPIFY_API_SECRET="your-api-secret"
SHOPIFY_APP_URL="https://your-ngrok-url.ngrok-free.app"

# Encryption (generate a 32-character key)
ENCRYPTION_KEY="your-32-char-encryption-key-here"
```

Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Output: a1b2c3d4e5f6... (32 characters)
```

### Step 4: Initialize the Database

```bash
npx prisma migrate dev --name init
```

This creates:
- SQLite database file (`prisma/dev.db`)
- All required tables (Shop, MessageLog, CustomerConsent, etc.)
- TypeScript types for your models

### Step 5: Start ngrok

In a separate terminal:

```bash
ngrok http 5173
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

Update your `.env`:

```bash
SHOPIFY_APP_URL="https://abc123.ngrok-free.app"
```

> **Note:** ngrok URLs change every time you restart. For persistent development, consider [ngrok paid plans](https://ngrok.com/pricing) or use a static domain.

### Step 6: Start the Development Server

```bash
npm run dev
```

Your app is now running at `http://localhost:5173`

## Initial Configuration

### Create Shopify App

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click "Apps" → "Create app" → "Create app manually"
3. Fill in app details:
   - **App name:** "Sent WhatsApp" (or your choice)
   - **App URL:** Your ngrok HTTPS URL
   - **Allowed redirection URL(s):** `https://your-ngrok-url.ngrok-free.app/auth/callback`

4. Click "Create app"
5. Go to "Configuration" → "Configure"
6. Enable these Admin API access scopes:
   ```
   read_orders          # Access order data
   read_checkouts       # Access checkout data
   read_customers       # Access customer data
   ```
7. Click "Save" → "Create app"

### Get Shopify Credentials

1. In your app dashboard, go to "API credentials"
2. Copy the **API key** and **API secret key**
3. Update your `.env`:
   ```bash
   SHOPIFY_API_KEY="your-api-key-here"
   SHOPIFY_API_SECRET="your-api-secret-here"
   ```

### Set Up Twilio

See the detailed [Twilio Setup Guide](./TWILIO-SETUP.md), or follow these quick steps:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy your **Account SID** and **Auth Token** from the dashboard
3. Navigate to Messaging → Try it out → Send a WhatsApp message
4. Join the WhatsApp Sandbox by sending the code from your personal WhatsApp
5. Note your Sandbox phone number (e.g., `+1 415 523 8886`)

## First-Time Installation Flow

### Install on Your Development Store

1. Visit your app's install URL:
   ```
   https://your-ngrok-url.ngrok-free.app/auth?shop=your-store.myshopify.com
   ```
   Replace `your-store` with your development store name.

2. Click "Install app" on the Shopify authorization screen
3. You'll be redirected to `/app?shop=your-store.myshopify.com`

### Configure Twilio Credentials

1. In the app dashboard, enter your Twilio credentials:
   - **Twilio Account SID:** Starts with `AC...`
   - **Twilio Auth Token:** Click "Auth Token" → "Copy" in Twilio Console

2. Click "Save Settings"

3. The status indicator should turn green: "App installed"

### Test the Integration

#### Test Order Confirmation

1. In your development store, place a test order
2. Use a customer with a phone number in E.164 format (e.g., `+1234567890`)
3. Check your WhatsApp for the confirmation message

#### Test Abandoned Cart

1. Add items to cart in your store
2. Start checkout and enter phone number
3. Close the browser (don't complete purchase)
4. Wait ~10 minutes for the abandoned cart webhook
5. Check your WhatsApp for the recovery message

## Troubleshooting

### "Invalid HMAC signature" Error

**Cause:** Shopify OAuth signature verification failed

**Solutions:**
- Ensure `SHOPIFY_API_SECRET` matches your app
- Check that your ngrok URL hasn't changed
- Verify the redirect URL in Shopify app settings

### Database Connection Errors

```bash
# Regenerate database
rm prisma/dev.db
npx prisma migrate dev --name init
```

### ngrok "Tunnel not found"

- ngrok URL changed - update `SHOPIFY_APP_URL` and Shopify app settings
- ngrok process stopped - restart it with `ngrok http 5173`

### WhatsApp Messages Not Sending

- Verify Twilio credentials in app dashboard
- Ensure you've joined the WhatsApp Sandbox
- Check Twilio Console for error logs
- Verify phone number format (E.164: `+1234567890`)

### Webhooks Not Receiving

- Ensure store has app installed and active
- Check ngrok is running and URL matches
- Verify webhook endpoints in Shopify app settings

## Next Steps

Now that you have the app running:

1. **[Configure Twilio WhatsApp](./TWILIO-SETUP.md)** - Set up production-ready messaging
2. **[Shopify Integration Guide](./SHOPIFY-INTEGRATION.md)** - Understand OAuth and webhooks
3. **[Dashboard Guide](./DASHBOARD-GUIDE.md)** - Learn to use the analytics
4. **[API Reference](./API.md)** - Build custom integrations

## Common Commands Reference

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server

# Database
npx prisma studio     # Open database GUI
npx prisma migrate dev # Create migration
npx prisma generate   # Regenerate types

# Testing
npm run test          # Run all tests
npm run test -- --watch # Watch mode

# Type checking
npm run typecheck     # Check TypeScript
```

## Need Help?

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Review the [API Reference](./API.md)
- See [Shopify App Dev Docs](https://shopify.dev/docs/apps)
- Visit [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)

---

**Previous:** [README.md](../README.md)  
**Next:** [Twilio Setup](./TWILIO-SETUP.md)
