# Shop Module Interface Design

## Problem Statement

The current `shop.server.ts` has a **dual-API problem**: callers don't know whether to use raw CRUD or encrypted variants. The encryption requirement is an implementation detail, not a domain concern—yet it leaks into every call site.

Current pain points:
- `createShop` vs `createShopWithEncryptedToken` — caller must know about encryption
- `getShopById` vs `getShopWithDecryptedToken` — caller decides decryption, not the module
- `updateShop` vs `updateShopTwilioCredentials` — partial overlap, unclear boundaries
- `consent.server.ts` bypasses the module entirely, uses `prisma.shop` directly

## Design Philosophy

**Optimize for the 80% case.** Route handlers don't care about encryption—they care about:
1. Creating a shop during OAuth (with credentials)
2. Checking if a shop is active
3. Updating Twilio settings
4. Getting credentials to send an SMS

The interface must make these one-line operations with obvious names.

## Interface (The Seam)

```typescript
// === Types ===
export type Shop = {
  id: string
  domain: string
  twilioAccountSid: string | null
  twilioAuthToken: string | null  // always plaintext when accessed
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ShopCreateInput = {
  domain: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  isActive?: boolean
}

export type ShopUpdateInput = {
  twilioAccountSid?: string
  twilioAuthToken?: string
  isActive?: boolean
}

// === Errors ===
export class ShopNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Shop not found: ${identifier}`)
    this.name = 'ShopNotFoundError'
  }
}

export class ShopCredentialsError extends Error {
  constructor(shopId: string) {
    super(`Shop ${shopId} has incomplete Twilio credentials`)
    this.name = 'ShopCredentialsError'
  }
}

// === Interface ===
export interface ShopModule {
  // Common case #1: Create shop during OAuth (id from domain)
  create(input: ShopCreateInput): Promise<Shop>

  // Common case #2: Check if shop exists and is active
  // Returns null if not found (non-error case for checks)
  findByDomain(domain: string): Promise<Shop | null>
  findById(id: string): Promise<Shop | null>

  // Common case #3: Update Twilio settings
  updateTwilioCredentials(
    idOrDomain: string,
    credentials: { twilioAccountSid: string; twilioAuthToken: string }
  ): Promise<Shop>

  // Common case #4: Get credentials for SMS (throws if incomplete)
  requireCredentials(shopId: string): Promise<{
    twilioAccountSid: string
    twilioAuthToken: string
  }>

  // Less common: activate/deactivate (convenience for boolean flip)
  activate(shopId: string): Promise<Shop>
  deactivate(shopId: string): Promise<Shop>

  // Edge case: full update (rarely needed)
  update(idOrDomain: string, input: ShopUpdateInput): Promise<Shop>

  // Edge case: delete (rare, mostly for testing)
  delete(id: string): Promise<void>
}
```

## Invariants

1. **Encryption is transparent**: `twilioAuthToken` in `Shop` is always plaintext; encryption happens at the seam.
2. **Credentials are atomic**: `requireCredentials` checks both SID and token are present.
3. **Idempotency**: `create` with existing domain updates instead of failing.
4. **Normalization**: Domain is always normalized to `*.myshopify.com` format.

## Ordering Constraints

- `create` → any operation
- `find*` → `update*`, `requireCredentials`, `activate/deactivate`
- `updateTwilioCredentials` → `requireCredentials` will succeed

## Usage Examples

### OAuth Callback (Common case #1)
```typescript
// Before: confused about which function to use
await createShopWithEncryptedToken({ id: shop, domain: shop, ... })

// After: one clear call
const shop = await shopModule.create({
  domain: params.shop,
  isActive: true,
})
```

### Check Active Status (Common case #2)
```typescript
// Before: have to strip sensitive fields manually
const shop = await getShopByDomain(domain)
if (!shop?.isActive) return redirect('/error')

// After: null = not found, still has credentials if needed
const shop = await shopModule.findByDomain(domain)
if (!shop?.isActive) return redirect('/error')
```

### Settings Update (Common case #3)
```typescript
// Before: specific function, unclear if it handles both fields
await updateShopTwilioCredentials(shop, { twilioAccountSid, twilioAuthToken })

// After: explicit, clear what it does
await shopModule.updateTwilioCredentials(shop, {
  twilioAccountSid,
  twilioAuthToken,
})
```

### Send SMS (Common case #4)
```typescript
// Before: caller has to check credentials exist
const shop = await getShopWithDecryptedToken(shopId)
if (!shop?.twilioAuthToken) throw new Error('No token')

// After: module enforces, caller handles error
const { twilioAccountSid, twilioAuthToken } = await shopModule.requireCredentials(shopId)
const twilio = new Twilio(twilioAccountSid, twilioAuthToken)
```

## Implementation Behind the Seam

```typescript
// File: app/modules/shop/shop.adapter.ts
export class PrismaShopAdapter implements ShopModule {
  constructor(
    private prisma: PrismaClient,
    private encryption: { encrypt(s: string): string; decrypt(s: string): string }
  ) {}

  async create(input: ShopCreateInput): Promise<Shop> {
    const domain = normalizeDomain(input.domain)
    const id = domain // Shopify shop ID is the domain

    const data: Prisma.ShopCreateInput = {
      id,
      domain,
      isActive: input.isActive ?? true,
      ...(input.twilioAccountSid && { twilioAccountSid: input.twilioAccountSid }),
      ...(input.twilioAuthToken && { twilioAuthToken: this.encryption.encrypt(input.twilioAuthToken) }),
    }

    const record = await this.prisma.shop.upsert({
      where: { id },
      create: data,
      update: { isActive: data.isActive },
    })

    return this.toShop(record)
  }

  async findByDomain(domain: string): Promise<Shop | null> {
    const record = await this.prisma.shop.findUnique({
      where: { domain: normalizeDomain(domain) },
    })
    return record ? this.toShop(record) : null
  }

  async requireCredentials(shopId: string): Promise<{ twilioAccountSid: string; twilioAuthToken: string }> {
    const record = await this.prisma.shop.findUnique({ where: { id: shopId } })
    if (!record) throw new ShopNotFoundError(shopId)

    const sid = record.twilioAccountSid
    const token = record.twilioAuthToken ? this.encryption.decrypt(record.twilioAuthToken) : null

    if (!sid || !token) {
      throw new ShopCredentialsError(shopId)
    }

    return { twilioAccountSid: sid, twilioAuthToken: token }
  }

  private toShop(record: PrismaShop): Shop {
    return {
      ...record,
      twilioAuthToken: record.twilioAuthToken ? this.encryption.decrypt(record.twilioAuthToken) : null,
    }
  }
}
```

## Dependency Strategy

Dependencies cross the seam as interfaces:

| Dependency | Seam Side | Adapter Side |
|------------|-----------|--------------|
| Database | `PrismaClient` interface | Concrete Prisma client |
| Encryption | `{ encrypt, decrypt }` | `~/utils/encryption` |

The adapter receives these via constructor—no hardcoded imports. This enables:
- Testing with in-memory DB and stub encryption
- Rotating encryption schemes without touching callers
- Swapping to another ORM if needed

## Trade-offs

### High Leverage
- **Encryption transparency**: Callers never think about encryption; it's handled at the seam.
- **Credential enforcement**: `requireCredentials` is the only way to get plaintext—can't forget to check.
- **Single entry point**: `create` handles both insert and re-activation (OAuth callback idempotency).

### Thin Leverage
- **Domain normalization**: Still exposed, caller could bypass. Mitigated by making domain a value object (future).
- **Prisma leak**: `Shop` type mirrors Prisma shape. Acceptable for now, can seal later.

### What Got Harder
- **Partial credential updates**: Must provide both SID and token to `updateTwilioCredentials`—intentional, prevents half-configured state.
- **Bulk operations**: Not supported; add only when needed.
- **Raw queries**: Must go through adapter; module owns the schema.

### Optimized For
- Route handler authors: one-line common operations.
- Security reviewers: encryption is centralized, not scattered.
- Future maintainers: schema changes touch only the adapter.

## Migration Path

1. Implement `ShopModule` interface + `PrismaShopAdapter`
2. Replace call sites one at a time:
   - `createShopFromOAuth` → `shopModule.create`
   - `getShopByDomain` → `shopModule.findByDomain`
   - `updateShopTwilioCredentials` → `shopModule.updateTwilioCredentials`
   - Direct `prisma.shop` access → appropriate method
3. Delete old functions once all migrated
4. Move module to `app/modules/shop/` (co-located domain)
