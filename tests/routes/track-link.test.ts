import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'

describe('Track Link Route', () => {
  beforeEach(async () => {
    await prisma.messageLog.deleteMany()
    await prisma.orderAttribution.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  it('should record click and redirect to cart', async () => {
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
        checkoutToken: 'checkout_abc123',
        customerPhone: '+1234567890',
        totalPrice: '99.99',
        lineItems: '[]',
        scheduledTaskId: 'task_abc',
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

    // Import and test the loader
    const { loader } = await import('~/routes/track.$id')
    
    const request = new Request(`http://localhost/track/${checkout.id}`)
    const params = { id: checkout.id }
    
    const response = await loader({ request, params, context: {} } as any)

    // Should redirect to cart
    expect(response.status).toBe(302)
    const location = response.headers.get('Location')
    expect(location).toBe('https://test-shop.myshopify.com/cart/checkout_abc123')

    // Verify click was recorded
    const updatedLog = await prisma.messageLog.findFirst({
      where: { abandonedCheckoutId: checkout.id }
    })
    expect(updatedLog?.clickCount).toBe(1)
    expect(updatedLog?.clickedAt).toBeInstanceOf(Date)
  })

  it('should return 404 for non-existent checkout', async () => {
    const { loader } = await import('~/routes/track.$id')
    
    const request = new Request(`http://localhost/track/nonexistent`)
    const params = { id: 'nonexistent' }
    
    const response = await loader({ request, params, context: {} } as any)

    expect(response.status).toBe(404)
  })
})
