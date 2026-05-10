# Dashboard Guide

Learn how to use the Sent dashboard to monitor and manage your WhatsApp messaging.

## Accessing the Dashboard

Navigate to:
```
https://your-app.com/dashboard?shop=your-shop.myshopify.com
```

## Dashboard Overview

The dashboard provides real-time insights into your messaging performance.

### Header

- **Shop Domain** - The Shopify store currently being viewed
- **Settings Link** - Quick access to app configuration

## Message Statistics

The stats grid shows four key metrics:

### Messages Sent (This Month)
- Total WhatsApp messages sent in the current month
- Shows remaining quota for free tier (200/month)

### Delivery Rate
- Percentage of messages successfully delivered
- Calculation: `delivered / sent × 100`

### Click-Through Rate
- Percentage of messages that generated clicks
- Indicates message effectiveness

### Recovered Revenue
- Total revenue from recovered abandoned carts
- Number of orders recovered via WhatsApp

## Features Section

Toggle messaging features on/off:

### Abandoned Cart Recovery
- **When Enabled**: Automatically sends WhatsApp messages to customers who abandoned their cart
- **Trigger**: Customer adds items but doesn't complete checkout within 1 hour
- **Message**: Personalized cart reminder with product details

### Order Confirmations
- **When Enabled**: Sends WhatsApp confirmation for every order placed
- **Trigger**: Order created in Shopify
- **Message**: Order summary with tracking info

### How to Toggle Features

1. Go to the **Features** section on the dashboard
2. Click the toggle switch next to the feature
3. Changes are saved automatically

## Message History

View the last 20 messages sent from your store:

### Columns

| Column | Description |
|--------|-------------|
| **Type** | Message type (Abandoned Cart or Order Confirmation) |
| **Phone** | Customer's masked phone number (e.g., `***1234`) |
| **Status** | Current message status |
| **Clicks** | Number of times the message link was clicked |
| **Sent** | Date and time message was sent |

### Message Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| **DELIVERED** | Green | Message successfully delivered to customer |
| **SENT** | Blue | Message sent, awaiting delivery confirmation |
| **PENDING** | Yellow | Message queued for sending |
| **FAILED** | Red | Message failed to send (check Twilio logs) |

### Empty State

If no messages appear:
1. Ensure features are enabled
2. Verify Twilio credentials are configured
3. Check that webhooks are receiving events from Shopify
4. Review the [troubleshooting guide](#troubleshooting)

## Understanding Metrics

### Delivery Rate Best Practices

- **Good**: > 95%
- **Average**: 85-95%
- **Needs Attention**: < 85%

**Improve delivery rate by:**
- Using confirmed WhatsApp numbers
- Sending during business hours
- Keeping messages under 1000 characters

### Click-Through Rate Benchmarks

- **Excellent**: > 15%
- **Good**: 8-15%
- **Average**: 3-8%

**Improve CTR by:**
- Personalizing message content
- Including clear call-to-action buttons
- Timing messages appropriately

### ROI Tracking

The Recovered Revenue metric shows:
- Total value of orders recovered
- Number of customers who returned to complete purchase

**ROI Calculation:**
```
ROI = (Recovered Revenue - Messaging Cost) / Messaging Cost × 100
```

## Quota Management

### Free Tier Limits

- **200 messages/month** per shop
- Resets on the 1st of each month
- Counter displayed in stats grid

### Upgrading

Need more messages? Contact us for Pro tier pricing.

### Monitoring Usage

Check your monthly usage at any time on the dashboard. You'll see:
- Messages sent this month
- Remaining quota
- Days until reset

## Troubleshooting

### No Messages Appearing

1. **Check Feature Toggles** - Ensure features are enabled
2. **Verify Credentials** - Twilio SID and Auth Token must be set
3. **Test Webhooks** - Shopify webhooks must be delivering events
4. **Review Logs** - Check Twilio console for delivery errors

### Low Delivery Rate

- Verify phone numbers are valid WhatsApp numbers
- Check Twilio account balance
- Review Twilio error logs for specific failures
- Ensure WhatsApp Sandbox is properly configured

### Messages Not Sending

1. Check Twilio credentials in Settings
2. Verify shop is active in database
3. Confirm webhook endpoints are accessible
4. Review server logs for errors

### Dashboard Not Loading

- Ensure `shop` query parameter is present in URL
- Verify user has permission to access this shop
- Check for JavaScript console errors
- Try refreshing the page

## Tips for Success

### Timing

- **Abandoned Cart**: Wait 1 hour before sending recovery message
- **Order Confirmation**: Send immediately after order placement
- **Business Hours**: Consider customer's timezone

### Message Content

- Keep messages concise and friendly
- Include product names and prices
- Add clear call-to-action (CTA) buttons
- Personalize with customer name when possible

### Compliance

- Always respect customer consent
- Provide opt-out instructions
- Follow WhatsApp Business Policy
- Keep message templates approved by Twilio

## Related Documentation

- [Getting Started](./GETTING-STARTED.md)
- [Twilio Setup](./TWILIO-SETUP.md)
- [Shopify Integration](./SHOPIFY-INTEGRATION.md)
- [API Reference](./API.md)

---

**Previous:** [Shopify Integration](./SHOPIFY-INTEGRATION.md)
**Next:** [API Reference](./API.md)
