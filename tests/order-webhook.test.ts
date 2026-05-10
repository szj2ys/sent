import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { processOrderWebhook } from '~/services/order.server'
import { saveShop } from '~/modules/shop'

describe('Order Webhook Handler', () => {
  beforeEach(async () => {
    await prisma.messageLog.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  describe('processOrderWebhook', () => {
    it('should send WhatsApp message when customer has phone and consent', async () => {
      // Setup: Create shop with Twilio config using new module (plaintext token)
      await saveShop({
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
        twilioAccountSid: 'AC_test_account',
        twilioAuthToken: 'my_secret_token',
      })

      // Setup: Create customer consent
      await prisma.customerConsent.create({
        data: {
          id: 'consent-1',
          shopId: 'test-shop.myshopify.com',
          phoneNumber: '+1234567890',
          consentedAt: new Date(),
        }
      })

      // Execute: Process webhook with valid order
      const webhookPayload = {
        id: 12345,
        name: '#1001',
        customer: {
          phone: '+1234567890',
          first_name: 'John',
        },
        total_price: '99.99',
        line_items: [{ title: 'Test Product', quantity: 1 }],
      }

      const result = await processOrderWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: webhookPayload,
      })

      // Verify: Message was sent and logged
      expect(result.success).toBe(true)
      expect(result.messageLog).toBeDefined()
      expect(result.messageLog?.status).toBe('SENT')

      // Verify: Database record created
      const logs = await prisma.messageLog.findMany({
        where: { shopId: 'test-shop.myshopify.com' }
      })
      expect(logs).toHaveLength(1)
      expect(logs[0].type).toBe('ORDER_CONFIRMATION')
      expect(logs[0].phoneNumber).toBe('+1234567890')
    })

    it('should skip silently when customer has no phone number', async () => {
      await saveShop({
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
      })

      const webhookPayload = {
        id: 12346,
        name: '#1002',
        customer: {
          phone: null,
          first_name: 'Jane',
        },
        total_price: '49.99',
        line_items: [],
      }

      const result = await processOrderWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: webhookPayload,
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_PHONE_NUMBER')
      
      const logs = await prisma.messageLog.findMany()
      expect(logs).toHaveLength(0)
    })

    it('should skip silently when customer has not consented', async () => {
      await saveShop({
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
      })

      const webhookPayload = {
        id: 12347,
        name: '#1003',
        customer: {
          phone: '+1234567890',
          first_name: 'Bob',
        },
        total_price: '29.99',
        line_items: [],
      }

      const result = await processOrderWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: webhookPayload,
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_CONSENT')
      
      const logs = await prisma.messageLog.findMany()
      expect(logs).toHaveLength(0)
    })

    it('should log FAILED status when shop missing Twilio config', async () => {
      await saveShop({
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
        // No Twilio config
      })

      await prisma.customerConsent.create({
        data: {
          id: 'consent-2',
          shopId: 'test-shop.myshopify.com',
          phoneNumber: '+1234567890',
          consentedAt: new Date(),
        }
      })

      const webhookPayload = {
        id: 12348,
        name: '#1004',
        customer: {
          phone: '+1234567890',
          first_name: 'Error',
        },
        total_price: '19.99',
        line_items: [],
      }

      const result = await processOrderWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: webhookPayload,
      })

      // Should not throw, should return failure result
      expect(result.success).toBe(false)
      expect(result.reason).toBe('CONFIG_ERROR')

      // A log should be created with FAILED status
      const logs = await prisma.messageLog.findMany()
      expect(logs).toHaveLength(1)
      expect(logs[0].status).toBe('FAILED')
      expect(logs[0].failedReason).toBe('Missing Twilio configuration')
    })
  })
})
