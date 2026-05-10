import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { processAbandonedCartTask } from '~/services/abandoned-cart.server'
import { trackLinkClick, processOrderAttribution } from '~/services/attribution.server'

describe('Attribution and ROI Calculation', () => {
  beforeEach(async () => {
    await prisma.orderAttribution.deleteMany()
    await prisma.messageLog.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  describe('trackLinkClick', () => {
    it('should increment click count and record timestamp when user clicks tracking link', async () => {
      // Setup: Create shop and abandoned checkout
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const checkout = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_123',
          customerPhone: '+1234567890',
          totalPrice: '99.99',
          lineItems: '[]',
          scheduledTaskId: 'task_123',
        }
      })

      const messageLog = await prisma.messageLog.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          type: 'ABANDONED_CART',
          phoneNumber: '+1234567890',
          templateId: 'abandoned_cart_v1',
          status: 'SENT',
          sentAt: new Date(),
          abandonedCheckoutId: checkout.id,
          trackingUrl: `/track/${checkout.id}`,
          clickCount: 0,
        }
      })

      // Execute: Track link click
      const result = await trackLinkClick({
        abandonedCheckoutId: checkout.id,
      })

      // Verify: Click was recorded
      expect(result.success).toBe(true)
      expect(result.redirectUrl).toBe(`https://test-shop.myshopify.com/cart/checkout_123`)

      const updatedLog = await prisma.messageLog.findUnique({
        where: { id: messageLog.id }
      })
      expect(updatedLog?.clickCount).toBe(1)
      expect(updatedLog?.clickedAt).toBeInstanceOf(Date)
    })

    it('should return not found when checkout does not exist', async () => {
      const result = await trackLinkClick({
        abandonedCheckoutId: 'nonexistent-id',
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('CHECKOUT_NOT_FOUND')
    })

    it('should accumulate multiple clicks', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const checkout = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_456',
          customerPhone: '+1234567890',
          totalPrice: '49.99',
          lineItems: '[]',
          scheduledTaskId: 'task_456',
        }
      })

      await prisma.messageLog.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          type: 'ABANDONED_CART',
          phoneNumber: '+1234567890',
          templateId: 'abandoned_cart_v1',
          status: 'SENT',
          sentAt: new Date(),
          abandonedCheckoutId: checkout.id,
          trackingUrl: `/track/${checkout.id}`,
          clickCount: 2,
          clickedAt: new Date(),
        }
      })

      // Click again
      await trackLinkClick({ abandonedCheckoutId: checkout.id })

      const updatedLog = await prisma.messageLog.findFirst({
        where: { abandonedCheckoutId: checkout.id }
      })
      expect(updatedLog?.clickCount).toBe(3)
    })
  })

  describe('processOrderAttribution', () => {
    it('should create OrderAttribution when order comes from tracked link', async () => {
      // Setup: Create shop with abandoned checkout that was clicked
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const checkout = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_789',
          customerPhone: '+1234567890',
          totalPrice: '149.99',
          lineItems: '[]',
          scheduledTaskId: 'task_789',
        }
      })

      const messageLog = await prisma.messageLog.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          type: 'ABANDONED_CART',
          phoneNumber: '+1234567890',
          templateId: 'abandoned_cart_v1',
          status: 'SENT',
          sentAt: new Date(),
          abandonedCheckoutId: checkout.id,
          trackingUrl: `/track/${checkout.id}`,
          clickCount: 1,
          clickedAt: new Date(),
        }
      })

      // Execute: Process order attribution
      const result = await processOrderAttribution({
        shopDomain: 'test-shop.myshopify.com',
        orderId: 'order_12345',
        checkoutToken: 'checkout_789',
        totalPrice: '149.99',
        customerPhone: '+1234567890',
      })

      // Verify: Attribution was created
      expect(result.success).toBe(true)
      expect(result.orderAttribution).toBeDefined()

      const attribution = await prisma.orderAttribution.findUnique({
        where: { orderId: 'order_12345' }
      })
      expect(attribution).toBeDefined()
      expect(attribution?.messageLogId).toBe(messageLog.id)
      expect(attribution?.abandonedCheckoutId).toBe(checkout.id)
      expect(attribution?.recoveredAmount).toBe('149.99')

      // Verify: Checkout marked as recovered
      const updatedCheckout = await prisma.abandonedCheckout.findUnique({
        where: { id: checkout.id }
      })
      expect(updatedCheckout?.recoveredAt).toBeInstanceOf(Date)
      expect(updatedCheckout?.orderId).toBe('order_12345')
    })

    it('should not attribute when no click was recorded', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const checkout = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_no_click',
          customerPhone: '+1234567890',
          totalPrice: '29.99',
          lineItems: '[]',
          scheduledTaskId: 'task_no_click',
        }
      })

      await prisma.messageLog.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          type: 'ABANDONED_CART',
          phoneNumber: '+1234567890',
          templateId: 'abandoned_cart_v1',
          status: 'SENT',
          sentAt: new Date(),
          abandonedCheckoutId: checkout.id,
          trackingUrl: `/track/${checkout.id}`,
          clickCount: 0,
        }
      })

      const result = await processOrderAttribution({
        shopDomain: 'test-shop.myshopify.com',
        orderId: 'order_999',
        checkoutToken: 'checkout_no_click',
        totalPrice: '29.99',
        customerPhone: '+1234567890',
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('NO_CLICK_ATTRIBUTION')

      const attribution = await prisma.orderAttribution.findUnique({
        where: { orderId: 'order_999' }
      })
      expect(attribution).toBeNull()
    })

    it('should not attribute when checkout not found', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const result = await processOrderAttribution({
        shopDomain: 'test-shop.myshopify.com',
        orderId: 'order_888',
        checkoutToken: 'nonexistent_checkout',
        totalPrice: '39.99',
        customerPhone: '+1234567890',
      })

      expect(result.success).toBe(false)
      expect(result.reason).toBe('CHECKOUT_NOT_FOUND')
    })
  })

  describe('calculateRecoveredRevenue', () => {
    it('should calculate total recovered revenue for a shop', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const checkout1 = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_1',
          customerPhone: '+1234567890',
          totalPrice: '99.99',
          lineItems: '[]',
          scheduledTaskId: 'task_1',
        }
      })

      const checkout2 = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_2',
          customerPhone: '+1234567890',
          totalPrice: '149.50',
          lineItems: '[]',
          scheduledTaskId: 'task_2',
        }
      })

      const checkout3 = await prisma.abandonedCheckout.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          checkoutToken: 'checkout_3',
          customerPhone: '+1234567890',
          totalPrice: '75.00',
          lineItems: '[]',
          scheduledTaskId: 'task_3',
        }
      })

      const msg1 = await prisma.messageLog.create({ data: { shopId: 'test-shop.myshopify.com', type: 'ABANDONED_CART', phoneNumber: '+1234567890', templateId: 'v1', status: 'SENT', abandonedCheckoutId: checkout1.id } })
      const msg2 = await prisma.messageLog.create({ data: { shopId: 'test-shop.myshopify.com', type: 'ABANDONED_CART', phoneNumber: '+1234567890', templateId: 'v1', status: 'SENT', abandonedCheckoutId: checkout2.id } })
      const msg3 = await prisma.messageLog.create({ data: { shopId: 'test-shop.myshopify.com', type: 'ABANDONED_CART', phoneNumber: '+1234567890', templateId: 'v1', status: 'SENT', abandonedCheckoutId: checkout3.id } })

      const { calculateRecoveredRevenue } = await import('~/services/attribution.server')

      // Create multiple attributed orders
      await prisma.orderAttribution.createMany({
        data: [
          {
            shopId: 'test-shop.myshopify.com',
            orderId: 'order_1',
            messageLogId: msg1.id,
            abandonedCheckoutId: checkout1.id,
            recoveredAmount: '99.99',
            customerPhone: '+1234567890',
            attributedAt: new Date(),
          },
          {
            shopId: 'test-shop.myshopify.com',
            orderId: 'order_2',
            messageLogId: msg2.id,
            abandonedCheckoutId: checkout2.id,
            recoveredAmount: '149.50',
            customerPhone: '+1234567890',
            attributedAt: new Date(),
          },
          {
            shopId: 'test-shop.myshopify.com',
            orderId: 'order_3',
            messageLogId: msg3.id,
            abandonedCheckoutId: checkout3.id,
            recoveredAmount: '75.00',
            customerPhone: '+1234567890',
            attributedAt: new Date(),
          },
        ]
      })

      const result = await calculateRecoveredRevenue('test-shop.myshopify.com')

      expect(result.totalRecovered).toBe(324.49)
      expect(result.orderCount).toBe(3)
    })

    it('should return zero when no attributed orders', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })

      const { calculateRecoveredRevenue } = await import('~/services/attribution.server')

      const result = await calculateRecoveredRevenue('test-shop.myshopify.com')

      expect(result.totalRecovered).toBe(0)
      expect(result.orderCount).toBe(0)
    })
  })
})
