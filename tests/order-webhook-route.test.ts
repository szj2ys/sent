import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import crypto from 'crypto'

describe('Order Webhook Route', () => {
  const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || ''
  
  beforeEach(async () => {
    await prisma.messageLog.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  function generateShopifyHmac(body: string): string {
    return crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64')
  }

  describe('POST /webhook/shopify/order', () => {
    it('should accept valid webhook and process order', async () => {
      // Setup shop and consent
      await prisma.shop.create({
        data: {
          id: 'test-shop.myshopify.com',
          domain: 'test-shop.myshopify.com',
          isActive: true,
          twilioAccountSid: 'AC_test',
          twilioAuthToken: 'token',
        }
      })
      await prisma.customerConsent.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          phoneNumber: '+1234567890',
        }
      })

      const payload = {
        id: 12345,
        name: '#1001',
        customer: {
          phone: '+1234567890',
          first_name: 'John',
        },
        total_price: '99.99',
        line_items: [{ title: 'Test Product', quantity: 1 }],
      }
      const body = JSON.stringify(payload)
      const hmac = generateShopifyHmac(body)

      const response = await fetch('http://localhost:3000/webhook/shopify/order', {
        method: 'POST',
        headers: {
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
          'X-Shopify-Hmac-Sha256': hmac,
          'Content-Type': 'application/json',
        },
        body,
      })

      expect(response.status).toBe(200)
      
      const logs = await prisma.messageLog.findMany()
      expect(logs).toHaveLength(1)
      expect(logs[0].status).toBe('SENT')
    })

    it('should reject invalid HMAC signature', async () => {
      const payload = { id: 12345, name: '#1001' }
      
      const response = await fetch('http://localhost:3000/webhook/shopify/order', {
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
          twilioAccountSid: 'AC_test',
          twilioAuthToken: 'token',
        }
      })
      // No consent record

      const payload = {
        id: 12346,
        name: '#1002',
        customer: {
          phone: '+1234567890',
          first_name: 'Jane',
        },
        total_price: '49.99',
        line_items: [],
      }
      const body = JSON.stringify(payload)
      const hmac = generateShopifyHmac(body)

      const response = await fetch('http://localhost:3000/webhook/shopify/order', {
        method: 'POST',
        headers: {
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
          'X-Shopify-Hmac-Sha256': hmac,
          'Content-Type': 'application/json',
        },
        body,
      })

      expect(response.status).toBe(200)
      
      const logs = await prisma.messageLog.findMany()
      expect(logs).toHaveLength(0)
    })
  })
})
