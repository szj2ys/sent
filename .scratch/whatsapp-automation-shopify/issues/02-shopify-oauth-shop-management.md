Status: done

## Parent

PRD.md

## What to build

Implement the Shopify OAuth flow and basic shop management UI. This slice proves that a merchant can install the app, their shop details are saved in our database, and they can view/edit their basic app settings (like saving their Twilio credentials) within the embedded Shopify App interface.

## Acceptance criteria

- [x] A merchant can install the app via a development store URL
- [x] The OAuth flow successfully completes and the `Shop` record is created/updated in the database
- [x] The embedded app UI loads within the Shopify admin
- [x] The UI contains a form to input and save Twilio Account SID and Auth Token
- [x] The Twilio credentials are saved securely (Auth Token encrypted) in the database

## Implementation

### Routes
- `GET /auth?shop=xxx` - Initiates OAuth flow, redirects to Shopify
- `GET /auth/callback` - Handles OAuth callback, validates HMAC, exchanges code for token
- `GET /app?shop=xxx` - Embedded app settings UI
- `GET/POST /api/settings` - API for Twilio credentials

### Services
- `app/services/shopify.server.ts` - OAuth URL building, HMAC verification, token exchange
- `app/utils/encryption.ts` - AES-256-GCM encryption for sensitive data

### Models
- `app/models/shop.server.ts` - Extended with encrypted credential functions
- Twilio Auth Token is encrypted using AES-256-GCM with authentication tag

### Tests
- 26 tests passing across:
  - Encryption utilities (4 tests)
  - Shop repository (5 tests)
  - Shop model (6 tests)
  - Encrypted shop operations (4 tests)
  - Shopify OAuth service (7 tests)

## Blocked by

- 01-infrastructure-remix-prisma-planetscale.md (completed)
