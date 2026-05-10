import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import crypto from 'crypto'

describe('Checkout Webhook Route', () => {
  const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || ''

  beforeEach(async () => {
    await prisma.messageLog.deleteMany()
    await prisma.abandonedCheckout.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  function generateShopifyHmac(body: string): string {
    return crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64')
  }

  describe('POST /webhook/shopify/checkout', () => {
    it('should accept valid webhook and create abandoned checkout', async () => {
      // Setup
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
        token: 'checkout_token_xyz',
        phone: '+1234567890',
        total_price: '99.99',
        line_items: [{ title: 'Test Product', quantity: 1 }],
      }
      const body = JSON.stringify(payload)
      const hmac = generateShopifyHmac(body)

      const response = await fetch('http://localhost:3000/webhook/shopify/checkout', {
        method: 'POST',
        headers: {
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
          'X-Shopify-Hmac-Sha256': hmac,
          'Content-Type': 'application/json',
        },
        body,
      })

      expect(response.status).toBe(200)

      const abandonedCheckouts = await prisma.abandonedCheckout.findMany({
        where: { shopId: 'test-shop.myshopify.com' }
      })
      expect(abandonedCheckouts).toHaveLength(1)
      expect(abandonedCheckouts[0].checkoutToken).toBe('checkout_token_xyz')
      expect(abandonedCheckouts[0].scheduledTaskId).toBeDefined()
    })

    it('should reject invalid HMAC signature', async () => {
      const payload = { token: 'test', phone: '+1234567890', total_price: '10', line_items: [] }

      const response = await fetch('http://localhost:3000/webhook/shopify/checkout', {
        method: 'POST',
        headers: {
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
          'X-Shopify-Hmac-Sha256': 'invalid-hmac',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      expect(response.status).toBe(401)
    })

    it('should return 200 even if customer has no consent (silent skip)', async () => {
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
        }
      })
      // No consent record

      const payload = {
        token: 'checkout_no_consent',
        phone: '+1234567890',
        total_price: '49.99',
        line_items: [],
      }
      const body = JSON.stringify(payload)
      const hmac = generateShopifyHmac(body)

      const response = await fetch('http://localhost:3000/webhook/shopify/checkout', {
        method: 'POST',
        headers: {
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
          'X-Shopify-Hmac-Sha256': hmac,
          'Content-Type': 'application/json',
        },
        body,
      })

      expect(response.status).toBe(200)
      
      const abandonedCheckouts = await prisma.abandonedCheckout.findMany()
      expect(abandonedCheckouts).toHaveLength(0)
    })
  })
})
