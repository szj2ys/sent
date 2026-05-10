import { describe, it, expect, beforeEach } from 'vitest'
import { mockShopStorage } from '~/modules/shop/adapter.mock'

describe('MockShopStorage', () => {
  let storage: ReturnType<typeof mockShopStorage>

  beforeEach(() => {
    storage = mockShopStorage()
  })

  describe('findByIdOrDomain', () => {
    it('returns null when shop not found', async () => {
      const shop = await storage.findByIdOrDomain('non-existent')
      expect(shop).toBeNull()
    })

    it('returns shop when found by id', async () => {
      await storage.upsert({
        id: 'shop-1',
        domain: 'test.myshopify.com',
        twilioAccountSid: 'AC123',
        twilioAuthToken: 'secret-token',
        isActive: true,
      })

      const shop = await storage.findByIdOrDomain('shop-1')

      expect(shop).not.toBeNull()
      expect(shop?.id).toBe('shop-1')
      expect(shop?.domain).toBe('test.myshopify.com')
      expect(shop?.twilioAuthToken).toBe('secret-token')
    })

    it('returns shop when found by domain', async () => {
      await storage.upsert({
        id: 'shop-2',
        domain: 'domain.myshopify.com',
        twilioAccountSid: 'AC456',
        twilioAuthToken: 'domain-secret',
      })

      const shop = await storage.findByIdOrDomain('domain.myshopify.com')

      expect(shop?.id).toBe('shop-2')
      expect(shop?.twilioAuthToken).toBe('domain-secret')
    })
  })

  describe('upsert', () => {
    it('creates new shop with all fields', async () => {
      const shop = await storage.upsert({
        id: 'new-shop',
        domain: 'new.myshopify.com',
        twilioAccountSid: 'AC999',
        twilioAuthToken: 'new-secret',
        isActive: true,
      })

      expect(shop.id).toBe('new-shop')
      expect(shop.domain).toBe('new.myshopify.com')
      expect(shop.twilioAccountSid).toBe('AC999')
      expect(shop.twilioAuthToken).toBe('new-secret')
      expect(shop.isActive).toBe(true)
      expect(shop.createdAt).toBeInstanceOf(Date)
    })

    it('uses default values for optional fields', async () => {
      const shop = await storage.upsert({
        id: 'minimal-shop',
        domain: 'minimal.myshopify.com',
      })

      expect(shop.id).toBe('minimal-shop')
      expect(shop.domain).toBe('minimal.myshopify.com')
      expect(shop.twilioAccountSid).toBeNull()
      expect(shop.twilioAuthToken).toBeNull()
      expect(shop.isActive).toBe(false)
    })

    it('updates existing shop', async () => {
      await storage.upsert({
        id: 'update-shop',
        domain: 'old.myshopify.com',
        twilioAuthToken: 'old-secret',
      })

      const updated = await storage.upsert({
        id: 'update-shop',
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
        id: 'preserve-date',
        domain: 'original.myshopify.com',
      })
      const originalDate = original.createdAt

      await new Promise(r => setTimeout(r, 10))

      const updated = await storage.upsert({
        id: 'preserve-date',
        domain: 'updated.myshopify.com',
      })

      expect(updated.createdAt).toBe(originalDate)
    })

    it('stores and returns plaintext twilioAuthToken without encryption', async () => {
      const saved = await storage.upsert({
        id: 'token-test',
        domain: 'token.myshopify.com',
        twilioAuthToken: 'my-plaintext-secret',
      })

      expect(saved.twilioAuthToken).toBe('my-plaintext-secret')

      const retrieved = await storage.findByIdOrDomain('token-test')
      expect(retrieved?.twilioAuthToken).toBe('my-plaintext-secret')
    })
  })
})
