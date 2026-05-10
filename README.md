# Sent - WhatsApp Cart Recovery for Shopify

Automatically send WhatsApp messages to recover abandoned carts and confirm orders. Free tier includes 200 messages/month.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React Router](https://img.shields.io/badge/React_Router-7.0-red.svg)](https://reactrouter.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748.svg)](https://www.prisma.io/)

## Features

- **Abandoned Cart Recovery** - Automatically message customers who leave items in their cart
- **Order Confirmations** - Send instant WhatsApp confirmations for every order
- **ROI Tracking** - See exactly how much revenue you've recovered
- **Free Tier** - 200 messages per month at no cost

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/sent.git
cd sent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Your app will be available at `http://localhost:5173`

## Documentation

- [Getting Started](./docs/GETTING-STARTED.md) - Prerequisites, installation, and configuration
- [Twilio Setup](./docs/TWILIO-SETUP.md) - WhatsApp Sandbox configuration
- [Shopify Integration](./docs/SHOPIFY-INTEGRATION.md) - Installing on your Shopify store
- [Dashboard Guide](./docs/DASHBOARD-GUIDE.md) - Using the analytics dashboard
- [API Reference](./docs/API.md) - REST API and webhook documentation

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS 4
- **Backend**: React Router (full-stack), TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Messaging**: Twilio WhatsApp API
- **Testing**: Vitest, Testing Library

## Project Structure

```
├── app/
│   ├── db/              # Database client
│   ├── models/          # Data models
│   ├── modules/         # Business logic modules
│   ├── routes/          # React Router routes
│   │   ├── home.tsx     # Landing page
│   │   ├── dashboard.tsx # Analytics dashboard
│   │   ├── app.tsx      # Settings page
│   │   ├── api/         # API endpoints
│   │   └── webhook/     # Shopify webhooks
│   ├── services/        # Background services
│   └── welcome/         # (deprecated)
├── docs/                # Documentation
├── prisma/              # Database schema
├── tests/               # Test files
└── public/              # Static assets
```

## Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sent"

# Twilio
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="your_whatsapp_number"

# Shopify
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_APP_URL="https://your-app.com"

# Encryption
ENCRYPTION_KEY="your_32_char_encryption_key"
```

## Development

```bash
# Run tests
npm test

# Run type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run with UI
npm test -- --ui

# Run specific test file
npm test -- tests/landing-page.test.tsx
```

## Deployment

### Docker

```bash
docker build -t sent-app .
docker run -p 3000:3000 --env-file .env sent-app
```

### Environment-Specific Notes

- Ensure `DATABASE_URL` points to a PostgreSQL instance
- Set `SHOPIFY_APP_URL` to your public URL
- Configure webhooks in Shopify Partner Dashboard
- Set up Twilio WhatsApp Sandbox for testing

## Architecture

### Data Flow

1. **Shopify Webhook** → Receives order/checkout events
2. **Message Service** → Determines if message should be sent
3. **Twilio API** → Sends WhatsApp message
4. **Database** → Logs message delivery status
5. **Dashboard** → Displays analytics

### Security

- All Twilio credentials are encrypted at rest
- Shopify webhooks are HMAC verified
- Customer phone numbers are masked in UI
- Consent management for opt-outs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Write tests for new features
- Run `npm run typecheck` before committing

## Troubleshooting

### Common Issues

**Messages not sending:**
- Verify Twilio credentials in Settings
- Check that shop is active
- Ensure webhooks are configured

**Dashboard not loading:**
- Ensure `shop` query parameter is present
- Check browser console for errors

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run migrations: `npx prisma migrate deploy`

See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for more help.

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using React Router, TypeScript, and Prisma.

**Next Steps:**
- [Complete the Getting Started guide](./docs/GETTING-STARTED.md)
- [Set up your Twilio WhatsApp Sandbox](./docs/TWILIO-SETUP.md)
- [Install the app on your Shopify store](./docs/SHOPIFY-INTEGRATION.md)
