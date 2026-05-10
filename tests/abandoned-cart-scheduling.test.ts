import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { 
  processCheckoutWebhook, 
  processAbandonedCartTask,
  markCheckoutAsRecovered 
} from '~/services/abandoned-cart.server'

describe('Abandoned Cart Scheduling', () => {
  beforeEach(async () => {
    await prisma.messageLog.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  describe('processCheckoutWebhook', () => {
    it('should create AbandonedCheckout record and schedule task', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      await prisma.customerConsent.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          phoneNumber: '+1234567890',
          consentedAt: new Date(),
        }
      })

      const result = await processCheckoutWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: {
          token: 'checkout_token_123',
          phone: '+1234567890',
          total_price: '99.99',
          line_items: [{ title: 'Test Product', quantity: 1 }],
        }
      })

      expect(result.success).toBe(true)
      expect(result.abandonedCheckout).toBeDefined()
      expect(result.abandonedCheckout?.checkoutToken).toBe('checkout_token_123')
      expect(result.abandonedCheckout?.scheduledTaskId).toBeDefined()

      const abandonedCheckouts = await prisma.abandonedCheckout.findMany({
        where: { shopId: 'test-shop.myshopify.com' }
      })
      expect(abandonedCheckouts).toHaveLength(1)
      expect(abandonedCheckouts[0].customerPhone).toBe('+1234567890')
      expect(abandonedCheckouts[0].totalPrice).toBe('99.99')
    })

    it('should skip silently when checkout has no phone number', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const result = await processCheckoutWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: {
          token: 'checkout_token_456',
          phone: null,
          total_price: '49.99',
          line_items: [],
        }
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_PHONE_NUMBER')

      const abandonedCheckouts = await prisma.abandonedCheckout.findMany()
      expect(abandonedCheckouts).toHaveLength(0)
    })

    it('should skip silently when customer has not consented', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const result = await processCheckoutWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: {
          token: 'checkout_token_789',
          phone: '+1234567890',
          total_price: '29.99',
          line_items: [],
        }
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_CONSENT')

      const abandonedCheckouts = await prisma.abandonedCheckout.findMany()
      expect(abandonedCheckouts).toHaveLength(0)
    })

    it('should skip silently when consent has been revoked', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })
      
      await prisma.customerConsent.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          phoneNumber: '+1234567890',
          consentedAt: new Date(),
          revokedAt: new Date(),
        }
      })

      const result = await processCheckoutWebhook({
        shopDomain: 'test-shop.myshopify.com',
        payload: {
          token: 'checkout_token_abc',
          phone: '+1234567890',
          total_price: '39.99',
          line_items: [],
        }
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_CONSENT')

      const abandonedCheckouts = await prisma.abandonedCheckout.findMany()
      expect(abandonedCheckouts).toHaveLength(0)
    })
  })

  describe('processAbandonedCartTask', () => {
    it('should send WhatsApp message when checkout is not converted', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
          twilioAccountSid: 'AC_test',
          twilioAuthToken: 'token',
        }
      })

      const abandonedCheckout = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_token_abc',
          customerPhone: '+1234567890',
          totalPrice: '99.99',
          lineItems: JSON.stringify([{ title: 'Test Product', quantity: 1 }]),
          scheduledTaskId: 'task_abc',
        }
      })

      const result = await processAbandonedCartTask({
        checkoutToken: 'checkout_token_abc',
        shopDomain: 'test-shop.myshopify.com',
      })

      expect(result.success).toBe(true)
      expect(result.messageLog).toBeDefined()
      expect(result.messageLog?.status).toBe('SENT')

      const messageLogs = await prisma.messageLog.findMany({
        where: { shopId: 'test-shop.myshopify.com' }
      })
      expect(messageLogs).toHaveLength(1)
      expect(messageLogs[0].type).toBe('ABANDONED_CART')
      expect(messageLogs[0].abandonedCheckoutId).toBe(abandonedCheckout.id)
      expect(messageLogs[0].phoneNumber).toBe('+1234567890')
      expect(messageLogs[0].trackingUrl).toBeDefined()
    })

    it('should be no-op when checkout is already recovered', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_token_recovered',
          customerPhone: '+1234567890',
          totalPrice: '49.99',
          lineItems: '[]',
          scheduledTaskId: 'task_recovered',
          recoveredAt: new Date(),
        }
      })

      const result = await processAbandonedCartTask({
        checkoutToken: 'checkout_token_recovered',
        shopDomain: 'test-shop.myshopify.com',
      })

      expect(result.success).toBe(true)
      expect(result.reason).toBe('ALREADY_RECOVERED')

      const messageLogs = await prisma.messageLog.findMany()
      expect(messageLogs).toHaveLength(0)
    })
  })

  describe('markCheckoutAsRecovered', () => {
    it('should mark abandoned checkout as recovered when order is created', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const abandonedCheckout = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_token_xyz',
          customerPhone: '+1234567890',
          totalPrice: '79.99',
          lineItems: '[]',
          scheduledTaskId: 'task_xyz',
        }
      })

      expect(abandonedCheckout.recoveredAt).toBeNull()

      const result = await markCheckoutAsRecovered({
        shopDomain: 'test-shop.myshopify.com',
        checkoutToken: 'checkout_token_xyz',
      })

      expect(result.success).toBe(true)

      const updated = await prisma.abandonedCheckout.findUnique({
        where: { id: abandonedCheckout.id }
      })
      expect(updated?.recoveredAt).not.toBeNull()
    })

    it('should return success even if checkout not found', async () => {
      const result = await markCheckoutAsRecovered({
        shopDomain: 'test-shop.myshopify.com',
        checkoutToken: 'nonexistent_token',
      })

      expect(result.success).toBe(true)
      expect(result.reason).toBe('CHECKOUT_NOT_FOUND')
    })
  })
})
