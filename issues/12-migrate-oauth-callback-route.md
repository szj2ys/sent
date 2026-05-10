Status: ready-for-agent

## Parent

09-shop-module-deepening

## What to build

Migrate the OAuth callback route to use the new Shop Module. Replace the old `createShopFromOAuth` with the new `saveShop` interface.

Current code in `app/routes/auth/callback.ts` calls:
- `createShopFromOAuth({ shop, accessToken })`

New approach:
- Normalize domain with `normalizeShopDomain`
- Check for existing shop via `getShop`
- Create or update via `saveShop`

This slice proves the new module works in a real production flow.

## Acceptance criteria

- [ ] OAuth callback uses new Shop Module
- [ ] Shop creation during OAuth works end-to-end
- [ ] Existing shop update (re-install) works correctly
- [ ] Route tests pass with new module

## Blocked by

10-shop-module-core-with-prisma-adapter
