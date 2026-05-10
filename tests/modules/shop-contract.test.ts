import { describe, it, expect, beforeEach } from 'vitest'
import { mockShopStorage } from '~/modules/shop/adapter.mock'
import { PrismaShopStorage } from '~/modules/shop/adapter.prisma'
import { prisma } from '~/db/client'
import type { ShopStorage, ShopInput } from '~/modules/shop'

// Factory functions for creating adapter instances
const adapters = {
  mock: () => mockShopStorage(),
  prisma: () => new PrismaShopStorage(),
}

describe('ShopStorage Contract', () => {
  describe.each([
    ['mock', adapters.mock],
    ['prisma', adapters.prisma],
  ] as const)('%s adapter', (name, createAdapter) => {
    let storage: ShopStorage

    beforeEach(async () => {
      storage = createAdapter()
      if (name === 'prisma') {
        await prisma.shop.deleteMany()
      }
    })

    describe('findByIdOrDomain', () => {
      it('returns null when shop not found', async () => {
        const shop = await storage.findByIdOrDomain('non-existent')
        expect(shop).toBeNull()
      })

      it('returns shop with plaintext token when found by id', async () => {
        await storage.upsert({
          id: 'contract-test-1',
          domain: 'contract1.myshopify.com',
          twilioAuthToken: 'my-secret-token',
        })

        const shop = await storage.findByIdOrDomain('contract-test-1')

        expect(shop).not.toBeNull()
        expect(shop?.id).toBe('contract-test-1')
        expect(shop?.twilioAuthToken).toBe('my-secret-token')
      })

      it('returns shop with plaintext token when found by domain', async () => {
        await storage.upsert({
          id: 'contract-test-2',
          domain: 'contract2.myshopify.com',
          twilioAuthToken: 'domain-secret',
        })

        const shop = await storage.findByIdOrDomain('contract2.myshopify.com')

        expect(shop?.id).toBe('contract-test-2')
        expect(shop?.twilioAuthToken).toBe('domain-secret')
      })

      it('handles null twilioAuthToken gracefully', async () => {
        await storage.upsert({
          id: 'contract-null-token',
          domain: 'nulltoken.myshopify.com',
        })

        const shop = await storage.findByIdOrDomain('contract-null-token')

        expect(shop?.twilioAuthToken).toBeNull()
      })
    })

    describe('upsert', () => {
      it('creates new shop with all fields', async () => {
        const shop = await storage.upsert({
          id: 'contract-upsert-1',
          domain: 'upsert1.myshopify.com',
          twilioAccountSid: 'AC123',
          twilioAuthToken: 'token123',
          isActive: true,
        })

        expect(shop.id).toBe('contract-upsert-1')
        expect(shop.domain).toBe('upsert1.myshopify.com')
        expect(shop.twilioAccountSid).toBe('AC123')
        expect(shop.twilioAuthToken).toBe('token123')
        expect(shop.isActive).toBe(true)
        expect(shop.createdAt).toBeInstanceOf(Date)
      })

      it('uses default values for optional fields', async () => {
        const shop = await storage.upsert({
          id: 'contract-minimal',
          domain: 'minimal.myshopify.com',
        })

        expect(shop.twilioAccountSid).toBeNull()
        expect(shop.twilioAuthToken).toBeNull()
        expect(shop.isActive).toBe(false)
      })

      it('updates existing shop', async () => {
        await storage.upsert({
          id: 'contract-update',
          domain: 'old.myshopify.com',
          twilioAuthToken: 'old-secret',
        })

        const updated = await storage.upsert({
          id: 'contract-update',
          domain: 'new.myshopify.com',
          twilioAuthToken: 'new-secret',
          isActive: true,
        })

        expect(updated.domain).toBe('new.myshopify.com')
        expect(updated.twilioAuthToken).toBe('new-secret')
        expect(updated.isActive).toBe(true)
      })

      it('preserves createdAt when updating', async () => {
        const original = await storage.upsert({
          id: 'contract-preserve',
          domain: 'preserve.myshopify.com',
        })
        const originalDate = original.createdAt

        await new Promise(r => setTimeout(r, 10))

        const updated = await storage.upsert({
          id: 'contract-preserve',
          domain: 'updated.myshopify.com',
        })

        expect(updated.createdAt).toEqual(originalDate)
      })
    })

    describe('save and retrieve round-trip', () => {
      it('returns same plaintext token after save and retrieve', async () => {
        const input: ShopInput = {
          id: 'round-trip-1',
          domain: 'roundtrip.myshopify.com',
          twilioAccountSid: 'AC_roundtrip',
          twilioAuthToken: 'round-trip-secret-token',
          isActive: true,
        }

        await storage.upsert(input)
        const retrieved = await storage.findByIdOrDomain('round-trip-1')

        expect(retrieved?.twilioAuthToken).toBe('round-trip-secret-token')
        expect(retrieved?.twilioAccountSid).toBe('AC_roundtrip')
        expect(retrieved?.isActive).toBe(true)
      })
    })
  })
})
