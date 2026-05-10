import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { action } from '~/routes/webhook/order'

describe('Order Webhook - Attribution', () => {
  beforeEach(async () => {
    await prisma.orderAttribution.deleteMany()
    await prisma.messageLog.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  it('should create order attribution when order comes from clicked link', async () => {
    // Setup
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
        checkoutToken: 'checkout_token_xyz',
        customerPhone: '+1234567890',
        totalPrice: '199.99',
        lineItems: '[]',
        scheduledTaskId: 'task_xyz',
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
        clickCount: 1,
        clickedAt: new Date(),
      }
    })

    await prisma.customerConsent.create({
      data: {
        shopId: 'test-shop.myshopify.com',
        phoneNumber: '+1234567890',
        consentedAt: new Date(),
      }
    })

    // Execute webhook
    const payload = {
      id: 12345,
      name: '#1001',
      checkout_token: 'checkout_token_xyz',
      customer: {
        phone: '+1234567890',
        first_name: 'John',
      },
      total_price: '199.99',
      line_items: [{ title: 'Test Product', quantity: 1 }],
    }

    const body = JSON.stringify(payload)
    const request = new Request('http://localhost/webhook/shopify/order', {
      method: 'POST',
      body,
      headers: {
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        'X-Shopify-Hmac-Sha256': 'test-hmac',
      },
    })

    // Mock HMAC verification
    process.env.SHOPIFY_API_SECRET = 'test'
    
    const response = await action({ request, params: {}, context: {} } as any)

    // Verify attribution was created
    const attribution = await prisma.orderAttribution.findUnique({
      where: { orderId: '12345' }
    })
    expect(attribution).toBeDefined()
    expect(attribution?.recoveredAmount).toBe('199.99')

    // Verify checkout marked as recovered
    const updatedCheckout = await prisma.abandonedCheckout.findUnique({
      where: { id: checkout.id }
    })
    expect(updatedCheckout?.recoveredAt).toBeInstanceOf(Date)
    expect(updatedCheckout?.orderId).toBe('12345')
  })

  it('should not attribute when no checkout token match', async () => {
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

    const payload = {
      id: 12346,
      name: '#1002',
      checkout_token: 'untracked_checkout_token',
      customer: {
        phone: '+1234567890',
        first_name: 'Jane',
      },
      total_price: '49.99',
      line_items: [],
    }

    const request = new Request('http://localhost/webhook/shopify/order', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        'X-Shopify-Hmac-Sha256': 'test-hmac',
      },
    })

    process.env.SHOPIFY_API_SECRET = 'test'

    const response = await action({ request, params: {}, context: {} } as any)

    const attribution = await prisma.orderAttribution.findUnique({
      where: { orderId: '12346' }
    })
    expect(attribution).toBeNull()
  })
})
