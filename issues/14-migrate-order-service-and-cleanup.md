Status: ready-for-agent

## Parent

09-shop-module-deepening

## What to build

Migrate the Order Service to use the new Shop Module, then clean up the old dual-API functions from `shop.server.ts`.

Current code in `app/services/order.server.ts` calls:
- `prisma.shop.findUnique` directly (bypasses repository)

New approach:
- Use `getShop(shopDomain)` to retrieve shop with credentials

After migration:
- Delete old functions from `app/models/shop.server.ts`
- Update `tests/models/shop.server.test.ts` to use new module
- Update `tests/shop-encrypted.test.ts` (become internal module tests)
- Remove obsolete test files

This slice completes the migration and removes the technical debt.

## Acceptance criteria

- [ ] Order service uses `getShop` instead of direct Prisma calls
- [ ] Old functions deleted from `shop.server.ts`
- [ ] Tests migrated to new module
- [ ] No references to old API remain in codebase
- [ ] All tests pass

## Blocked by

12-migrate-oauth-callback-route
13-migrate-settings-api-route
