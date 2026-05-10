# Twilio Setup Guide

Complete guide to configuring Twilio for WhatsApp messaging in your Shopify store. This covers sandbox setup for development and security best practices.

## Table of Contents

- [Creating a Twilio Account](#creating-a-twilio-account)
- [Finding Your Credentials](#finding-your-credentials)
- [Setting Up WhatsApp Sandbox](#setting-up-whatsapp-sandbox)
- [Configuring in Sent App](#configuring-in-sent-app)
- [Security Best Practices](#security-best-practices)
- [Moving to Production](#moving-to-production)
- [Troubleshooting](#troubleshooting)

## Creating a Twilio Account

### Sign Up

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Enter your name, email, and create a password
3. Verify your email address
4. Enter your phone number for verification
5. Answer a few questions about your use case

### Trial Account Benefits

Your trial account includes:
- **$15.50** in free credits (enough for testing)
- **1 WhatsApp Sandbox** phone number
- Full API access with rate limits
- Valid for unlimited time while active

### Trial Limitations

- Messages can only be sent to verified numbers
- WhatsApp Sandbox expires after 24 hours of inactivity
- Rate limited to 1 message per second
- "Sent from your Twilio trial account" prepended to messages

## Finding Your Credentials

### Account SID and Auth Token

These are your API credentials for sending messages:

1. Log in to [Twilio Console](https://console.twilio.com/)
2. On the dashboard homepage, find the **Account Info** section
3. Copy these values:

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token:  [Click the eye icon to reveal]
```

**Screenshot placeholder:** ![Twilio Console Account Info](screenshots/twilio-account-info.png)

> **Security Warning:** Never commit your Auth Token to version control. The Sent app encrypts this value before storage.

### Where to Use These

In your Sent app dashboard:

| Field | Value | Format |
|-------|-------|--------|
| Twilio Account SID | `ACxxxxxxxx...` | Starts with `AC` |
| Twilio Auth Token | Your secret token | 32 characters |

Or in environment variables:

```bash
# .env file (not recommended for production)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token-here"
```

## Setting Up WhatsApp Sandbox

The WhatsApp Sandbox lets you test messaging without a business-approved WhatsApp Business API account.

### Join the Sandbox

1. In Twilio Console, navigate to:
   ```
   Messaging → Try it out → Send a WhatsApp message
   ```

2. You'll see a screen with:
   - A phone number to message (e.g., `+1 415 523 8886`)
   - A join code (e.g., `join abc-defg`)

3. **From your personal WhatsApp**, send the join code to that number:
   ```
   join abc-defg
   ```

4. Wait for the confirmation message from Twilio

**Screenshot placeholder:** ![WhatsApp Sandbox Join](screenshots/twilio-whatsapp-join.png)

### Understanding the Sandbox

| Aspect | Details |
|--------|---------|
| **Phone Number** | Shared across all trial users |
| **Session Duration** | 24 hours from last message |
| **Message Prefix** | "Sent from your Twilio trial account - " |
| **Recipient Limit** | Only numbers you've verified |
| **Rate Limit** | 1 message per second |

### Rejoining the Sandbox

If your session expires:

1. Go back to the WhatsApp Sandbox page
2. A new join code will be generated
3. Send `join new-code` from your WhatsApp
4. The session resets for another 24 hours

### Verifying Phone Numbers

For trial accounts, you must verify each recipient:

1. In Twilio Console, go to:
   ```
   Phone Numbers → Manage → Verified Caller IDs
   ```

2. Click "Add a new Caller ID"
3. Enter the phone number in E.164 format (e.g., `+1234567890`)
4. Twilio will call or text a verification code
5. Enter the code to verify

> **Note:** In production with a WhatsApp Business API account, this verification step is not required.

## Configuring in Sent App

### Enter Credentials

1. Install the Sent app on your Shopify store
2. Navigate to the app dashboard (`/app?shop=your-store.myshopify.com`)
3. Enter your credentials:

```
┌─────────────────────────────────────────┐
│  WhatsApp Automation Settings           │
├─────────────────────────────────────────┤
│                                         │
│  Twilio Account SID                     │
│  ┌─────────────────────────────────┐   │
│  │ ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Twilio Auth Token                      │
│  ┌─────────────────────────────────┐   │
│  │ ••••••••••••••••••••••••••••• │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Save Settings]                        │
│                                         │
└─────────────────────────────────────────┘
```

### Test Your Setup

After saving, test the configuration:

1. Place a test order in your Shopify store
2. Use a verified phone number at checkout
3. Check your WhatsApp for the confirmation message
4. Check the Sent app dashboard for delivery status

### Credential Storage

Sent encrypts your credentials using AES-256:

```typescript
// How credentials are stored (app/utils/encryption.ts)
const encrypted = encrypt(twilioAuthToken, ENCRYPTION_KEY)
// Stored in database as encrypted blob
```

- Credentials are decrypted only when sending messages
- The encryption key is set via `ENCRYPTION_KEY` environment variable
- Auth tokens are never logged or exposed in API responses

## Security Best Practices

### 1. Use Environment Variables

Never hardcode credentials:

```bash
# ✅ Good: Use environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID

# ❌ Bad: Never do this
const accountSid = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 2. Rotate Auth Tokens Regularly

1. In Twilio Console, go to **Settings → API keys & tokens**
2. Click **Request a secondary token**
3. Update your app with the new token
4. Delete the old token after confirming everything works

### 3. Restrict API Key Permissions

For production, use API Keys instead of Auth Token:

1. Go to **Settings → API keys & tokens → Create API key**
2. Choose "Standard" key type
3. Grant only necessary permissions:
   - `Programmable Messaging`
   - Incoming `Phone Numbers` (if using webhooks)

### 4. Enable IP Allowlisting

1. In Twilio Console, go to **Settings → Geo permissions**
2. Enable only regions where you operate
3. For webhooks, use IP allowlisting in your firewall

### 5. Monitor Usage

Set up alerts for unusual activity:

1. Go to **Settings → Usage → Triggers**
2. Create triggers for:
   - Daily message count thresholds
   - Unusual spending patterns
   - Failed message rate increases

### 6. Secure Webhook Endpoints

If Twilio sends webhooks to your app:

```typescript
// Verify Twilio signatures
import twilio from 'twilio'

function verifyWebhook(request: Request) {
  const signature = request.headers.get('X-Twilio-Signature')
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const url = request.url
  const params = Object.fromEntries(new URL(request.url).searchParams)
  
  return twilio.validateRequest(authToken, signature, url, params)
}
```

## Moving to Production

### WhatsApp Business API

For production use, you need a WhatsApp Business API account:

1. **Option 1: Twilio Hosted**
   - Easiest setup
   - $1/month per phone number
   - Message fees apply

2. **Option 2: Self-Hosted (360dialog)**
   - More control
   - Lower per-message costs
   - Requires server management

### Apply for WhatsApp Business

1. In Twilio Console, go to **Messaging → Senders → WhatsApp senders**
2. Click **Create new sender**
3. Choose **WhatsApp Business API**
4. Follow Meta's business verification process:
   - Verify business identity
   - Add payment method
   - Submit for approval (1-3 business days)

### Production Checklist

- [ ] WhatsApp Business API approved
- [ ] Dedicated phone number purchased
- [ ] Business profile configured
- [ ] Message templates approved (for notifications)
- [ ] Rate limits understood and planned for
- [ ] Fallback mechanisms for failed messages
- [ ] Monitoring and alerting in place

### Cost Estimates

| Component | Cost |
|-----------|------|
| WhatsApp Business API | $0 (self-hosted) or $1/mo (Twilio) |
| Messages - Marketing | $0.085-0.143 per message (varies by region) |
| Messages - Utility | $0.020-0.084 per message |
| Messages - Authentication | $0.020-0.084 per message |

> **Note:** Sent's free tier covers 200 messages/month. After that, Twilio charges apply.

## Troubleshooting

### "Authentication failed" Error

**Symptoms:** Messages fail with 401 or 403 errors

**Solutions:**

1. Check Account SID format (starts with `AC`)
2. Regenerate Auth Token in Twilio Console
3. Ensure no extra spaces in credentials
4. Verify credentials are properly encrypted in storage

### "From number not valid" Error

**Symptoms:** Messages fail with "not a valid From number"

**Solutions:**

1. Rejoin the WhatsApp Sandbox (session expired)
2. Verify the recipient number is verified (trial mode)
3. Check phone number format (E.164: `+1234567890`)

### Messages Not Delivered

**Symptoms:** Sent but not received

**Check:**

1. WhatsApp Sandbox session is active (rejoin if needed)
2. Recipient number is correct and verified
3. Twilio Console logs show "delivered" status
4. Phone has internet connection

### Rate Limit Errors

**Symptoms:** "Rate limit exceeded" errors

**Solutions:**

1. Trial accounts: Wait 1 second between messages
2. Production: Request rate limit increase from Twilio
3. Implement retry logic with exponential backoff

```typescript
// Retry logic example
async function sendWithRetry(message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sendMessage(message)
    } catch (err) {
      if (err.code === 20429) { // Rate limit
        await sleep(1000 * Math.pow(2, i)) // Exponential backoff
        continue
      }
      throw err
    }
  }
}
```

### Webhook Delivery Failures

If using Twilio webhooks for delivery status:

1. Ensure webhook URL is publicly accessible (use ngrok for local)
2. Check webhook is returning 200 OK quickly (< 10 seconds)
3. Verify webhook signature validation is correct

## Reference

### E.164 Phone Number Format

All phone numbers must be in E.164 format:

```
+[Country Code][National Number]

Examples:
+14155552671    # US
+442071838750   # UK
+8613812345678  # China
```

### Twilio Console Links

| Resource | URL |
|----------|-----|
| Console Home | https://console.twilio.com/ |
| Account Settings | https://console.twilio.com/us1/account/settings |
| API Keys | https://console.twilio.com/us1/account/keys-credentials/api-keys |
| WhatsApp Sandbox | https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn |
| Logs | https://console.twilio.com/us1/monitor/logs |

### API Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Message queued for delivery |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check credentials |
| 404 | Not Found | Phone number invalid |
| 429 | Rate Limited | Slow down requests |
| 500 | Server Error | Contact Twilio support |

---

**Previous:** [Getting Started](./GETTING-STARTED.md)  
**Next:** [Shopify Integration](./SHOPIFY-INTEGRATION.md)
