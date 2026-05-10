Status: completed

## Parent

PRD.md

## What to build

Prepare the app for production deployment and Shopify App Store submission. This slice includes configuring a production database, setting up a hosting provider, configuring production Twilio credentials, and creating the necessary documentation for App Store review.

## Acceptance criteria

- [x] A hosting provider is selected and configured (e.g., Vercel, Fly.io, or Railway)
- [x] A production PlanetScale database is created and migrations applied
- [x] Environment variables for production (Twilio credentials, Shopify API keys, Inngest/Trigger.dev keys) are configured
- [x] The app is successfully deployed and accessible via a public URL
- [x] Shopify App Store listing materials are prepared (app name, description, screenshots, privacy policy)
- [x] A decision is made on the Twilio production account setup (sub-accounts per merchant vs single account)
- [x] [HITL] Owner approval required for hosting costs and Twilio billing setup

## Blocked by

- 07-merchant-dashboard.md ✓
