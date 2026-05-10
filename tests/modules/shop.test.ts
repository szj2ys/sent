import { describe, it, expect, beforeEach } from 'vitest'
import { getShop, saveShop } from '~/modules/shop'
import { prisma } from '~/db/client'

describe('Shop Module', () => {
  beforeEach(async () => {
    await prisma.shop.deleteMany()
  })

  describe('getShop', () => {
    it('returns decrypted shop when found by id', async () => {
      const { encrypt } = await import('~/utils/encryption')
      const encryptedToken = encrypt('my-secret-token')
      
      await prisma.shop.create({
        data: {
          id: 'test-shop-id',
          domain: 'test.myshopify.com',
          twilioAccountSid: 'AC1234567890',
          twilioAuthToken: encryptedToken,
          isActive: true,
        }
      })

      const shop = await getShop('test-shop-id')

      expect(shop).not.toBeNull()
      expect(shop?.id).toBe('test-shop-id')
      expect(shop?.domain).toBe('test.myshopify.com')
      expect(shop?.twilioAuthToken).toBe('my-secret-token')
    })

    it('returns decrypted shop when found by domain', async () => {
      const { encrypt } = await import('~/utils/encryption')
      const encryptedToken = encrypt('domain-secret')
      
      await prisma.shop.create({
        data: {
          id: 'test-shop-2',
          domain: 'domain.myshopify.com',
          twilioAccountSid: 'AC789',
          twilioAuthToken: encryptedToken,
          isActive: true,
        }
      })

      const shop = await getShop('domain.myshopify.com')

      expect(shop?.id).toBe('test-shop-2')
      expect(shop?.twilioAuthToken).toBe('domain-secret')
    })

    it('returns null when shop not found', async () => {
      const shop = await getShop('non-existent-id')
      expect(shop).toBeNull()
    })

    it('handles null twilioAuthToken gracefully', async () => {
      await prisma.shop.create({
        data: {
          id: 'no-token-shop',
          domain: 'notoken.myshopify.com',
          twilioAccountSid: null,
          twilioAuthToken: null,
          isActive: true,
        }
      })

      const shop = await getShop('no-token-shop')

      expect(shop?.twilioAuthToken).toBeNull()
    })
  })

  describe('saveShop', () => {
    it('creates new shop with encrypted token', async () => {
      const shop = await saveShop({
        id: 'new-shop-id',
        domain: 'new.myshopify.com',
        twilioAccountSid: 'AC999',
        twilioAuthToken: 'super-secret',
        isActive: true,
      })

      expect(shop.id).toBe('new-shop-id')
      expect(shop.domain).toBe('new.myshopify.com')
      expect(shop.twilioAuthToken).toBe('super-secret')
      expect(shop.isActive).toBe(true)

      // Verify stored value is encrypted
      const rawShop = await prisma.shop.findUnique({
        where: { id: 'new-shop-id' },
      })
      expect(rawShop?.twilioAuthToken).not.toBe('super-secret')
      expect(rawShop?.twilioAuthToken).toContain(':')
    })

    it('updates existing shop and re-encrypts token', async () => {
      await saveShop({
        id: 'update-shop-id',
        domain: 'update.myshopify.com',
        twilioAuthToken: 'original-secret',
      })

      const updated = await saveShop({
        id: 'update-shop-id',
        domain: 'updated.myshopify.com',
        twilioAuthToken: 'updated-secret',
        isActive: true,
      })

      expect(updated.domain).toBe('updated.myshopify.com')
      expect(updated.twilioAuthToken).toBe('updated-secret')

      const rawShop = await prisma.shop.findUnique({
        where: { id: 'update-shop-id' },
      })
      expect(rawShop?.domain).toBe('updated.myshopify.com')
      expect(rawShop?.twilioAuthToken).not.toBe('updated-secret')
    })

    it('uses default values for optional fields', async () => {
      const shop = await saveShop({
        id: 'minimal-shop',
        domain: 'minimal.myshopify.com',
      })

      expect(shop.id).toBe('minimal-shop')
      expect(shop.domain).toBe('minimal.myshopify.com')
      expect(shop.twilioAccountSid).toBeNull()
      expect(shop.twilioAuthToken).toBeNull()
      expect(shop.isActive).toBe(false)
    })

    it('handles null twilioAuthToken', async () => {
      const shop = await saveShop({
        id: 'null-token-shop',
        domain: 'nulltoken.myshopify.com',
        twilioAuthToken: undefined,
      })

      expect(shop.twilioAuthToken).toBeNull()
    })
  })
})
