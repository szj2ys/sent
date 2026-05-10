import { prisma } from '~/db/client'
import { encrypt, decrypt } from '~/utils/encryption'
import type { Shop, ShopInput, ShopStorage } from './types'

export class PrismaShopStorage implements ShopStorage {
  async findByIdOrDomain(idOrDomain: string): Promise<Shop | null> {
    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ id: idOrDomain }, { domain: idOrDomain }],
      },
    })

    if (!shop) return null

    return this.decryptShop(shop)
  }

  async upsert(shop: ShopInput): Promise<Shop> {
    const data = await prisma.shop.upsert({
      where: { id: shop.id },
      create: {
        id: shop.id,
        domain: shop.domain,
        twilioAccountSid: shop.twilioAccountSid ?? null,
        twilioAuthToken: this.encryptToken(shop.twilioAuthToken),
        isActive: shop.isActive ?? false,
      },
      update: {
        domain: shop.domain,
        twilioAccountSid: shop.twilioAccountSid ?? null,
        twilioAuthToken: this.encryptToken(shop.twilioAuthToken),
        isActive: shop.isActive ?? false,
      },
    })

    return this.decryptShop(data)
  }

  private encryptToken(token: string | undefined): string | null {
    return token ? encrypt(token) : null
  }

  private decryptShop(shop: {
    id: string
    domain: string
    twilioAccountSid: string | null
    twilioAuthToken: string | null
    isActive: boolean
    createdAt: Date
  }): Shop {
    return {
      ...shop,
      twilioAuthToken: shop.twilioAuthToken ? decrypt(shop.twilioAuthToken) : null,
    }
  }
}

// Singleton instance for default usage
export const prismaShopStorage = new PrismaShopStorage()
