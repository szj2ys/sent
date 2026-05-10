import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { loader } from '~/routes/api/roi'

describe('ROI API', () => {
  beforeEach(async () => {
    await prisma.orderAttribution.deleteMany()
    await prisma.messageLog.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  it('should return recovered revenue statistics for a shop', async () => {
    // Setup: Create shop with attributed orders
    const shop = await prisma.shop.create({
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

    const msg1 = await prisma.messageLog.create({
      data: {
        shopId: 'test-shop.myshopify.com',
        type: 'ABANDONED_CART',
        phoneNumber: '+1234567890',
        templateId: 'v1',
        status: 'SENT',
        abandonedCheckoutId: checkout1.id,
      }
    })

    await prisma.orderAttribution.create({
      data: {
        shopId: 'test-shop.myshopify.com',
        orderId: 'order_1',
        messageLogId: msg1.id,
        abandonedCheckoutId: checkout1.id,
        recoveredAmount: '99.99',
        customerPhone: '+1234567890',
      }
    })

    // Execute: Call ROI API
    const request = new Request('http://localhost/api/roi?shopId=test-shop.myshopify.com')
    const response = await loader({ request, params: {}, context: {} } as any)

    // Verify response
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.totalRecovered).toBe(99.99)
    expect(data.orderCount).toBe(1)
  })

  it('should return zero for shop with no attributed orders', async () => {
    await prisma.shop.create({
      data: {
        id: 'empty-shop.myshopify.com',
        domain: 'empty-shop.myshopify.com',
        isActive: true,
      }
    })

    const request = new Request('http://localhost/api/roi?shopId=empty-shop.myshopify.com')
    const response = await loader({ request, params: {}, context: {} } as any)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.totalRecovered).toBe(0)
    expect(data.orderCount).toBe(0)
  })

  it('should return 400 when shopId is missing', async () => {
    const request = new Request('http://localhost/api/roi')
    const response = await loader({ request, params: {}, context: {} } as any)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing shopId parameter')
  })
})
