Status: ready-for-agent

## Parent

PRD: Deepen Shop Module Architecture

## Problem Statement

The current `shop.server.ts` exposes two parallel APIs for the same Shop concept:

1. **Raw CRUD functions** (`createShop`, `updateShop`, `getShopById`) — just pass through to Prisma
2. **Encrypted variants** (`createShopWithEncryptedToken`, `updateShopTwilioCredentials`, `getShopWithDecryptedToken`) — handle encryption

This creates friction for developers:
- Callers must know which API variant to use for each scenario
- It's easy to accidentally save plaintext tokens or forget to decrypt when needed
- Encryption logic leaks into multiple places
- Testing requires understanding the dual-API split

## Solution

Consolidate into a single, deep Shop Module with a minimal interface:

```typescript
// Get shop — token always decrypted
getShop(idOrDomain: string): Promise<Shop | null>

// Save shop — token automatically encrypted
saveShop(shop: ShopInput): Promise<Shop>
```

**Core invariant**: If `twilioAuthToken` exists on a `Shop` object, it is **always plaintext**. The seam handles all encryption/decryption transparently. Callers never think about encryption.

## User Stories

1. As a developer, I want to get a shop by domain without choosing between "raw" or "encrypted" variants, so that I can write simpler code.
2. As a developer, I want the `twilioAuthToken` to always be in plaintext when I access it on a `Shop` object, so that I never accidentally use encrypted data.
3. As a developer, I want to save a shop without explicitly calling an encryption function, so that security is handled automatically.
4. As a developer, I want the Shop Module to be testable with a mock adapter, so that I can write fast, isolated tests.
5. As a security reviewer, I want encryption logic concentrated in one place, so that I can verify it once and trust it everywhere.
6. As a maintainer, I want to change the encryption algorithm without modifying callers, so that security upgrades are low-risk.

## Implementation Decisions

### Module Structure

The Shop Module follows the deep module pattern with a clear seam:

- **Interface** (`types.ts`): Defines the `Shop` type and module contract
- **Module** (`index.ts`): Implements `getShop` and `saveShop` with encryption/decryption logic
- **Adapter** (`adapter.prisma.ts`): Satisfies the storage interface using Prisma
- **Test Adapter** (`adapter.mock.ts`): In-memory implementation for tests

### Encryption Handling

All encryption/decryption happens at the module's storage boundary:

- When loading from DB: ciphertext → decrypted → returned to caller
- When saving to DB: plaintext from caller → encrypted → stored

This ensures the invariant: `Shop.twilioAuthToken` is always plaintext in application code.

### Error Handling

- `getShop` returns `null` for not-found (callers decide if this is an error)
- `saveShop` throws on validation errors or storage failures

### Backward Compatibility

The migration is incremental:

1. Create new Shop Module in `app/modules/shop/`
2. Update call sites one at a time:
   - `app/routes/auth/callback.ts` (OAuth callback)
   - `app/routes/api/settings.ts` (settings loader/action)
   - `app/services/order.server.ts` (order processing)
3. Remove old functions from `app/models/shop.server.ts`
4. Update tests to use new module

## Testing Decisions

### What makes a good test

Tests should verify **behavior**, not implementation details:
- Saving a shop with a token and retrieving it returns the same plaintext token
- The module enforces the "always plaintext" invariant
- Errors propagate correctly

### Modules to test

- Shop Module (`app/modules/shop/`):
  - Encryption/decryption round-trip
  - getShop returns decrypted data
  - saveShop stores encrypted data
  - Adapter injection works (test with mock adapter)

### Prior art

- `tests/models/shop.server.test.ts`: Current CRUD tests (migrate to new module)
- `tests/shop-encrypted.test.ts`: Current encryption tests (become internal module tests)
- Use same pattern: `beforeEach` to clean database, Vitest for assertions

## Out of Scope

- Changing the encryption algorithm (AES-256-GCM remains)
- Adding new Shop fields
- Modifying the database schema
- Full Twilio integration (just credentials storage)
- Refactoring other modules (consent, order processing only as needed)

## Further Notes

This deepening is based on the "minimize interface" design principle. The trade-off is:
- **Gain**: 2 functions instead of 8+, clear invariant, better testability
- **Cost**: No partial updates (must get-then-save), no Prisma `select`/`include` exposed

The module can be extended later with additional entry points if needed (e.g., `findByDomain`, bulk operations), but starting minimal keeps the seam clean.

See `app/models/shop-deep.interface.md` (created during design) for additional context on the interface design.
