Status: completed

## Parent

09-shop-module-deepening

## What to build

Create the deep Shop Module core with automatic encryption/decryption and Prisma adapter. This slice delivers a complete, testable module that hides encryption complexity from callers.

The module implements the core invariant: `twilioAuthToken` is always plaintext in application code. All encryption/decryption happens at the storage boundary.

Key decisions from prototype:
```typescript
// Interface: 2 functions
getShop(idOrDomain: string): Promise<Shop | null>
saveShop(shop: ShopInput): Promise<Shop>

// Invariant: if twilioAuthToken exists on Shop, it's always plaintext
```

Structure:
- `app/modules/shop/types.ts` — Shop type definitions
- `app/modules/shop/index.ts` — Module implementation with encryption logic
- `app/modules/shop/adapter.prisma.ts` — Prisma storage adapter

## Acceptance criteria

- [x] Shop Module created at `app/modules/shop/`
- [x] `getShop(idOrDomain)` returns decrypted shop (null if not found)
- [x] `saveShop(shop)` stores encrypted token automatically
- [x] `twilioAuthToken` invariant documented and enforced
- [x] Prisma adapter implements storage interface
- [x] Module exports clear public interface

## Implementation Summary

Created Shop Module with 8 passing tests covering:
- getShop by id and domain
- getShop returns null for missing shops
- getShop handles null tokens gracefully
- saveShop creates new shops with encrypted storage
- saveShop updates existing shops
- saveShop uses default values for optional fields
- saveShop handles null/undefined tokens

Files created:
- `app/modules/shop/types.ts` - Type definitions and storage interface
- `app/modules/shop/adapter.prisma.ts` - Prisma storage implementation
- `app/modules/shop/index.ts` - Public API with documented invariants
- `tests/modules/shop.test.ts` - Integration tests

## Blocked by

None - completed
