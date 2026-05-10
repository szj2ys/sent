import type { Shop, ShopInput, ShopStorage } from './types'

export function mockShopStorage(): ShopStorage {
  const shops = new Map<string, Shop>()

  return {
    async findByIdOrDomain(idOrDomain: string): Promise<Shop | null> {
      const byId = shops.get(idOrDomain)
      if (byId) return byId

      for (const shop of shops.values()) {
        if (shop.domain === idOrDomain) return shop
      }

      return null
    },
    async upsert(input: ShopInput): Promise<Shop> {
      const now = new Date()
      const existing = await this.findByIdOrDomain(input.id)
      
      const shop: Shop = {
        id: input.id,
        domain: input.domain,
        twilioAccountSid: input.twilioAccountSid ?? null,
        twilioAuthToken: input.twilioAuthToken ?? null,
        isActive: input.isActive ?? false,
        createdAt: existing?.createdAt ?? now,
      }

      shops.set(input.id, shop)
      return shop
    },
  }
}
