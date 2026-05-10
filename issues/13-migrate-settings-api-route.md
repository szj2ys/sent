Status: ready-for-agent

## Parent

09-shop-module-deepening

## What to build

Migrate the Settings API route to use the new Shop Module. Replace the dual-API calls (`getShopByDomain`, `updateShopTwilioCredentials`) with unified `getShop`/`saveShop`.

Current code in `app/routes/api/settings.ts` calls:
- `getShopByDomain(shop)` for loader
- `updateShopTwilioCredentials(shop, credentials)` for action

New approach:
- `getShop(domain)` — returns shop with decrypted token
- `saveShop({ ...shop, twilioAccountSid, twilioAuthToken })` — auto-encrypts

This slice demonstrates the developer experience improvement: no more choosing between "raw" and "encrypted" variants.

## Acceptance criteria

- [ ] Settings loader uses `getShop(domain)`
- [ ] Settings action uses `saveShop` with plaintext token
- [ ] Token encryption happens automatically (invisible to route)
- [ ] Route tests pass with new module

## Blocked by

10-shop-module-core-with-prisma-adapter
