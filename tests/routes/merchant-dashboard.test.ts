import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'

describe('Merchant Dashboard', () => {
  beforeEach(async () => {
    await prisma.orderAttribution.deleteMany()
    await prisma.messageLog.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  describe('GET /api/dashboard/stats', () => {
    it('should return message statistics for the shop', async () => {
      // Setup: Create shop with message logs
      const shop = await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Create message logs with various statuses
      await prisma.messageLog.createMany({
        data: [
          {
            shopId: shop.id,
            type: 'ABANDONED_CART',
            phoneNumber: '+1234567890',
            templateId: 'abandoned_cart_v1',
            status: 'DELIVERED',
            sentAt: thisMonth,
            deliveredAt: new Date(thisMonth.getTime() + 1000),
            clickCount: 1,
            clickedAt: new Date(thisMonth.getTime() + 5000),
          },
          {
            shopId: shop.id,
            type: 'ORDER_CONFIRMATION',
            phoneNumber: '+1234567891',
            templateId: 'order_confirmation_v1',
            status: 'DELIVERED',
            sentAt: thisMonth,
            deliveredAt: new Date(thisMonth.getTime() + 2000),
            clickCount: 1,
            clickedAt: new Date(thisMonth.getTime() + 3000),
          },
          {
            shopId: shop.id,
            type: 'ABANDONED_CART',
            phoneNumber: '+1234567892',
            templateId: 'abandoned_cart_v1',
            status: 'FAILED',
            sentAt: thisMonth,
            failedReason: 'Invalid phone number',
          },
          {
            shopId: shop.id,
            type: 'ABANDONED_CART',
            phoneNumber: '+1234567893',
            templateId: 'abandoned_cart_v1',
            status: 'SENT',
            sentAt: thisMonth,
            clickCount: 1,
            clickedAt: new Date(thisMonth.getTime() + 4000),
          },
        ]
      })

      // Execute: Call dashboard stats API
      const { loader } = await import('~/routes/api/dashboard/stats')
      const request = new Request('http://localhost/api/dashboard/stats?shopId=test-shop.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      // Verify: Stats are calculated correctly
      expect(data.shopId).toBe('test-shop.myshopify.com')
      expect(data.messagesSentThisMonth).toBe(4)
      expect(data.messagesDelivered).toBe(2)
      expect(data.deliveryRate).toBe(50) // 2 delivered out of 4 sent
      expect(data.clickThroughRate).toBe(75) // 3 messages with clicks out of 4 sent
      expect(data.remainingQuota).toBe(196) // 200 free quota - 4 sent
    })

    it('should return zero stats when shop has no messages', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const { loader } = await import('~/routes/api/dashboard/stats')
      const request = new Request('http://localhost/api/dashboard/stats?shopId=test-shop.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(data.messagesSentThisMonth).toBe(0)
      expect(data.deliveryRate).toBe(0)
      expect(data.clickThroughRate).toBe(0)
      expect(data.remainingQuota).toBe(200)
    })

    it('should return recovered revenue data', async () => {
      const shop = await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const checkout = await prisma.abandonedCheckout.create({
        data: {
          shopId: shop.id,
          checkoutToken: 'checkout_123',
          customerPhone: '+1234567890',
          totalPrice: '199.99',
          lineItems: '[]',
          scheduledTaskId: 'task_123',
          recoveredAt: new Date(),
        }
      })

      const messageLog = await prisma.messageLog.create({
        data: {
          shopId: shop.id,
          type: 'ABANDONED_CART',
          phoneNumber: '+1234567890',
          templateId: 'abandoned_cart_v1',
          status: 'DELIVERED',
          sentAt: new Date(),
          deliveredAt: new Date(),
          abandonedCheckoutId: checkout.id,
          clickCount: 1,
        }
      })

      await prisma.orderAttribution.create({
        data: {
          shopId: shop.id,
          orderId: 'order_123',
          messageLogId: messageLog.id,
          abandonedCheckoutId: checkout.id,
          recoveredAmount: '199.99',
          customerPhone: '+1234567890',
        }
      })

      const { loader } = await import('~/routes/api/dashboard/stats')
      const request = new Request('http://localhost/api/dashboard/stats?shopId=test-shop.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(data.totalRecoveredOrders).toBe(1)
      expect(data.totalRecoveredRevenue).toBe(199.99)
    })
  })

  describe('GET /api/dashboard/messages', () => {
    it('should return recent message history with status', async () => {
      const shop = await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const now = new Date()

      await prisma.messageLog.createMany({
        data: [
          {
            shopId: shop.id,
            type: 'ABANDONED_CART',
            phoneNumber: '+1234567890',
            templateId: 'abandoned_cart_v1',
            status: 'DELIVERED',
            sentAt: new Date(now.getTime() - 10000),
            deliveredAt: new Date(now.getTime() - 9000),
          },
          {
            shopId: shop.id,
            type: 'ORDER_CONFIRMATION',
            phoneNumber: '+1234567891',
            templateId: 'order_confirmation_v1',
            status: 'SENT',
            sentAt: new Date(now.getTime() - 20000),
          },
        ]
      })

      const { loader } = await import('~/routes/api/dashboard/messages')
      const request = new Request('http://localhost/api/dashboard/messages?shopId=test-shop.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(data.messages).toHaveLength(2)
      expect(data.messages[0].status).toBe('DELIVERED')
      expect(data.messages[0].type).toBe('ABANDONED_CART')
      expect(data.messages[1].status).toBe('SENT')
      expect(data.messages[1].type).toBe('ORDER_CONFIRMATION')
    })
  })

  describe('GET /api/dashboard/settings', () => {
    it('should return feature toggles for the shop', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
          enableAbandonedCart: true,
          enableOrderConfirmation: false,
        }
      })

      const { loader } = await import('~/routes/api/dashboard/settings')
      const request = new Request('http://localhost/api/dashboard/settings?shopId=test-shop.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(data.enableAbandonedCart).toBe(true)
      expect(data.enableOrderConfirmation).toBe(false)
    })
  })

  describe('POST /api/dashboard/settings', () => {
    it('should update feature toggles', async () => {
      const shop = await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
          enableAbandonedCart: false,
          enableOrderConfirmation: false,
        }
      })

      const { action } = await import('~/routes/api/dashboard/settings')
      const formData = new FormData()
      formData.append('shopId', shop.id)
      formData.append('enableAbandonedCart', 'true')
      formData.append('enableOrderConfirmation', 'true')

      const request = new Request('http://localhost/api/dashboard/settings', {
        method: 'POST',
        body: formData,
      })

      await action({ request, params: {}, context: {} } as any)

      const updatedShop = await prisma.shop.findUnique({
        where: { id: shop.id }
      })

      expect(updatedShop?.enableAbandonedCart).toBe(true)
      expect(updatedShop?.enableOrderConfirmation).toBe(true)
    })
  })
})
