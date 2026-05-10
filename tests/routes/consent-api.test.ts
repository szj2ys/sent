import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { collectConsent } from '~/services/consent.server'

describe('Consent API', () => {
  beforeEach(async () => {
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  describe('collectConsent service', () => {
    it('should store consent when given valid shop domain and phone number', async () => {
      // Setup: Create a shop
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      // Execute: Collect consent
      const result = await collectConsent({
        shopDomain: 'test-shop.myshopify.com',
        phoneNumber: '+1234567890',
      })

      // Verify: Returns success
      expect(result.success).toBe(true)
      expect(result.consent).toBeDefined()
      expect(result.consent?.phoneNumber).toBe('+1234567890')

      // Verify: Stored in database
      const saved = await prisma.customerConsent.findUnique({
        where: {
          shopId_phoneNumber: {
            shopId: 'test-shop.myshopify.com',
            phoneNumber: '+1234567890',
          }
        }
      })
      expect(saved).not.toBeNull()
      expect(saved?.phoneNumber).toBe('+1234567890')
      expect(saved?.revokedAt).toBeNull()
    })

    it('should return error when shop does not exist', async () => {
      // Execute: Try to collect consent for non-existent shop
      const result = await collectConsent({
        shopDomain: 'non-existent.myshopify.com',
        phoneNumber: '+1234567890',
      })

      // Verify: Returns failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('SHOP_NOT_FOUND')

      // Verify: Nothing stored in database
      const saved = await prisma.customerConsent.findMany()
      expect(saved).toHaveLength(0)
    })

    it('should update consent and clear revokedAt when customer re-consents', async () => {
      // Setup: Create shop and existing revoked consent
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const revokedAt = new Date('2024-01-01')
      await prisma.customerConsent.create({
        data: {
          id: 'consent-1',
          shopId: 'test-shop.myshopify.com',
          phoneNumber: '+1234567890',
          consentedAt: new Date('2023-01-01'),
          revokedAt: revokedAt,
        }
      })

      // Execute: Re-collect consent
      const result = await collectConsent({
        shopDomain: 'test-shop.myshopify.com',
        phoneNumber: '+1234567890',
      })

      // Verify: Returns success
      expect(result.success).toBe(true)

      // Verify: revokedAt is cleared and consentedAt is updated
      const saved = await prisma.customerConsent.findUnique({
        where: {
          shopId_phoneNumber: {
            shopId: 'test-shop.myshopify.com',
            phoneNumber: '+1234567890',
          }
        }
      })
      expect(saved?.revokedAt).toBeNull()
      expect(saved?.consentedAt.getTime()).toBeGreaterThan(revokedAt.getTime())
    })

    it('should reject invalid phone number format', async () => {
      // Setup: Create a shop
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      // Execute: Try to collect consent with invalid phone
      const result = await collectConsent({
        shopDomain: 'test-shop.myshopify.com',
        phoneNumber: 'not-a-phone-number',
      })

      // Verify: Returns failure
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_PHONE_NUMBER')

      // Verify: Nothing stored in database
      const saved = await prisma.customerConsent.findMany()
      expect(saved).toHaveLength(0)
    })
  })
})
