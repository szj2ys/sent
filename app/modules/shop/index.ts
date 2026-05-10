// Shop Module
// 
// Core invariant: twilioAuthToken is always plaintext in application code.
// All encryption/decryption happens at the storage boundary.
//
// Usage:
//   const shop = await getShop('myshop.myshopify.com')
//   const saved = await saveShop({ id: '123', domain: '...', twilioAuthToken: 'secret' })
//   // saved.twilioAuthToken is plaintext, automatically decrypted from storage

import type { Shop, ShopInput, ShopStorage } from './types'
import { prismaShopStorage } from './adapter.prisma'

export type { Shop, ShopInput, ShopStorage }
export { PrismaShopStorage, prismaShopStorage } from './adapter.prisma'
export { mockShopStorage } from './adapter.mock'

// Default storage adapter (can be overridden for testing)
let storage: ShopStorage = prismaShopStorage

/**
 * Get a shop by id or domain. Returns decrypted shop with plaintext twilioAuthToken.
 * Returns null if shop not found.
 */
export async function getShop(idOrDomain: string): Promise<Shop | null> {
  return storage.findByIdOrDomain(idOrDomain)
}

/**
 * Create or update a shop. Automatically encrypts twilioAuthToken for storage.
 * Returns the saved shop with decrypted (plaintext) twilioAuthToken.
 */
export async function saveShop(shop: ShopInput): Promise<Shop> {
  return storage.upsert(shop)
}

/**
 * Set a custom storage adapter (useful for testing).
 */
export function setShopStorage(adapter: ShopStorage): void {
  storage = adapter
}
