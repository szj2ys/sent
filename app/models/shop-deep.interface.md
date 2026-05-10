# Shop Module: DEEP Interface Design

## Problem Statement

The current `shop.server.ts` exposes a dual-API problem:
- Raw CRUD functions that don't handle encryption
- Encrypted variants that do

Callers don't know which to use. The constraint is: `twilioAuthToken` MUST be encrypted in DB but sometimes needed in plaintext for API calls.

---

## 1. Interface (The Seam)

The interface lives at `~/models/shop`. It exposes exactly **2 entry points**:

```typescript
// ~/models/shop/index.ts

export interface Shop {
  id: string
  domain: string
  twilioAccountSid: string | null
  twilioAuthToken: string | null  // Always plaintext in memory
  isActive: boolean
  createdAt: Date
}

// Shop without sensitive credentials (for UI/serialization)
export type ShopPublic = Omit<Shop, 'twilioAuthToken'>

/**
 * Get a shop by domain or id.
 * Returns null if not found.
 * twilioAuthToken is always decrypted (if exists).
 */
export async function getShop(idOrDomain: string): Promise<Shop | null>

/**
 * Save a shop. Creates if new, updates if exists.
 * twilioAuthToken is automatically encrypted before persistence.
 * Returns the saved shop with decrypted token.
 */
export async function saveShop(shop: ShopInput): Promise<Shop>

export interface ShopInput {
  id: string
  domain: string
  twilioAccountSid?: string | null
  twilioAuthToken?: string | null
  isActive?: boolean
}
```

### Invariants

1. **Encryption is opaque**: Callers never see encrypted data; the Module handles all encryption/decryption at the seam.
2. **Token is always plaintext in Shop**: If `twilioAuthToken` exists on a `Shop` object, it is the decrypted plaintext.
3. **Nulls pass through**: `null` tokens remain `null` (never encrypted/decrypted).
4. **Idempotency**: `getShop` followed by `saveShop` is a no-op if no changes.
5. **Upsert semantics**: `saveShop` creates on new id, updates on existing.

### Error Modes

| Error | Condition | Type |
|-------|-----------|------|
| `ShopNotFoundError` | getShop returns nothing | `null` (not thrown) |
| `EncryptionError` | Decryption fails (corrupt data) | Throws `ShopModuleError` |
| `DatabaseError` | Prisma failure | Throws `ShopModuleError` |

---

## 2. Usage Example

```typescript
// routes/api/settings.ts
import { getShop, saveShop } from '~/models/shop'

// GET /api/settings?shop=foo.myshopify.com
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shopDomain = url.searchParams.get('shop')
  
  if (!shopDomain) {
    return Response.json({ error: 'Missing shop' }, { status: 400 })
  }

  const shop = await getShop(shopDomain)
  if (!shop) {
    return Response.json({ error: 'Shop not found' }, { status: 404 })
  }

  // Return public view (no token) to client
  return Response.json({
    shop: toPublic(shop)  // strips sensitive fields
  })
}

// POST /api/settings
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json()
  const { shop: domain, twilioAccountSid, twilioAuthToken } = body

  const existing = await getShop(domain)
  if (!existing) {
    return Response.json({ error: 'Shop not found' }, { status: 404 })
  }

  // Save with new credentials - encryption happens automatically
  const updated = await saveShop({
    ...existing,
    twilioAccountSid,
    twilioAuthToken,
  })

  // Use decrypted token immediately for validation
  const twilio = new TwilioClient(updated.twilioAccountSid!, updated.twilioAuthToken!)
  await twilio.validateCredentials()

  return Response.json({ success: true })
}

// Helper: strip sensitive data for client
function toPublic(shop: Shop): ShopPublic {
  const { twilioAuthToken, ...rest } = shop
  return rest
}
```

### Calling code does NOT:
- Know encryption exists
- Choose between encrypted/unencrypted variants
- Handle raw Prisma types

---

## 3. Implementation Behind the Seam

```typescript
// ~/models/shop/adapter.prisma.ts

import { prisma } from '~/db/client'
import { encrypt, decrypt } from '~/utils/encryption'
import type { Shop, ShopInput } from './index'

export async function getShop(idOrDomain: string): Promise<Shop | null> {
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ id: idOrDomain }, { domain: idOrDomain }]
    }
  })

  if (!shop) return null

  return {
    ...shop,
    twilioAuthToken: shop.twilioAuthToken 
      ? decrypt(shop.twilioAuthToken) 
      : null
  }
}

export async function saveShop(input: ShopInput): Promise<Shop> {
  const data = {
    id: input.id,
    domain: input.domain,
    twilioAccountSid: input.twilioAccountSid ?? null,
    twilioAuthToken: input.twilioAuthToken 
      ? encrypt(input.twilioAuthToken) 
      : null,
    isActive: input.isActive ?? false,
  }

  const saved = await prisma.shop.upsert({
    where: { id: input.id },
    create: data,
    update: {
      domain: data.domain,
      twilioAccountSid: data.twilioAccountSid,
      twilioAuthToken: data.twilioAuthToken,
      isActive: data.isActive,
    }
  })

  // Return decrypted version for consistency
  return {
    ...saved,
    twilioAuthToken: saved.twilioAuthToken 
      ? decrypt(saved.twilioAuthToken) 
      : null
  }
}
```

### Why the implementation re-decrypts on return

This ensures the invariant: *If `twilioAuthToken` exists on a `Shop`, it is plaintext.* Callers never need to check "is this encrypted?"

---

## 4. Dependency Strategy

### Dependencies Crossing the Seam

```
┌─────────────────────────────────────────┐
│           Callers (Routes)              │
├─────────────────────────────────────────┤
│  ~/models/shop/index.ts (Interface)     │  ← The Seam
├─────────────────────────────────────────┤
│  ~/models/shop/adapter.prisma.ts        │
│    - Uses: ~/db/client                  │
│    - Uses: ~/utils/encryption           │
└─────────────────────────────────────────┘
```

| Dependency | Direction | Adaptation |
|------------|-----------|------------|
| `prisma` | Inward | Prisma client wrapped by adapter |
| `encrypt/decrypt` | Inward | Pure functions, no adaptation needed |

### Adapter Pattern

The **Adapter** (`adapter.prisma.ts`) satisfies the **Interface** (`index.ts`) at the **Seam**. To swap implementations:

```typescript
// For testing - swap adapter
export { getShop, saveShop } from './adapter.mock'

// For production
export { getShop, saveShop } from './adapter.prisma'
```

---

## 5. Trade-offs

### High Leverage

| Area | Leverage | Explanation |
|------|----------|-------------|
| **Callers** | High | 2 functions vs 8+. No encryption knowledge needed. |
| **Testing** | High | Mock adapter eliminates DB + encryption dependencies. |
| **Security** | High | Encryption cannot be forgotten; it's automatic at the seam. |
| **Refactoring** | High | Change encryption scheme in one place. |

### Thin Areas (Cost Paid)

| Area | Thin | Explanation |
|------|------|-------------|
| **Performance** | Thin | Double decryption on save (encrypt to DB, decrypt to return). Acceptable for correctness. |
| **Batch ops** | Thin | No bulk save/get. Add only if needed. |
| **Partial updates** | Thin | Must fetch before update (no `updateShop(id, partial)`). This is intentional: forces read-before-write, prevents races. |

### What Was Given Up

1. **Raw Prisma types**: Callers get `Shop`, not `Prisma.Shop`. Loss: direct access to Prisma relations.
2. **Partial updates**: No `updateShop(id, { isActive: true })`. Must `get` then `save`.
3. **Query customization**: No `select`, `include`, `orderBy` exposed. Add dedicated methods if needed (e.g., `listActiveShops()`).

---

## Locality

Bugs and changes concentrate in one place:
- **Encryption bugs**: Only in adapter
- **DB schema changes**: Only in adapter
- **New shop fields**: Add to `Shop` type + adapter mapping

Callers are protected from all of these.

---

## Depth Summary

```
Interface surface: 2 functions, 2 types
Implementation depth: ~40 lines of adapter logic
Behavior delivered: CRUD + transparent encryption + type safety + invariant enforcement

Depth ratio: High (much behavior, small interface)
```
