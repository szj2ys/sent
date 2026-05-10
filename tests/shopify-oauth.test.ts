import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { buildShopifyAuthUrl, verifyShopifyHmac, exchangeCodeForToken, createShopFromOAuth } from '~/services/shopify.server'

describe('Shopify OAuth Service', () => {
  beforeEach(async () => {
    await prisma.shop.deleteMany()
  })

  describe('buildShopifyAuthUrl', () => {
    it('should build valid OAuth URL with required params', () => {
      const url = buildShopifyAuthUrl('test-shop.myshopify.com', 'random-state')
      
      expect(url).toContain('https://test-shop.myshopify.com/admin/oauth/authorize')
      expect(url).toContain('client_id=')
      expect(url).toContain('scope=')
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('state=random-state')
    })

    it('should normalize shop domain', () => {
      const url1 = buildShopifyAuthUrl('test-shop', 'state')
      const url2 = buildShopifyAuthUrl('TEST-SHOP.MYSHOPIFY.COM', 'state')
      
      expect(url1).toContain('test-shop.myshopify.com')
      expect(url2).toContain('test-shop.myshopify.com')
    })
  })

  describe('verifyShopifyHmac', () => {
    it('should verify valid HMAC signature', () => {
      const crypto = require('crypto')
      const secret = process.env.SHOPIFY_API_SECRET || ''
      
      // Build message exactly as Shopify would
      const message = 'shop=test-shop.myshopify.com&timestamp=1234567890'
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex')
      
      // Pass raw query string (not URLSearchParams encoded)
      const queryString = `shop=test-shop.myshopify.com&timestamp=1234567890&hmac=${hmac}`
      
      expect(verifyShopifyHmac(queryString)).toBe(true)
    })

    it('should reject invalid HMAC signature', () => {
      const queryString = 'shop=test-shop.myshopify.com&timestamp=1234567890&hmac=invalid-hmac'
      
      expect(verifyShopifyHmac(queryString)).toBe(false)
    })

    it('should reject missing hmac', () => {
      const queryString = 'shop=test-shop.myshopify.com&timestamp=1234567890'
      
      expect(verifyShopifyHmac(queryString)).toBe(false)
    })
  })

  describe('createShopFromOAuth', () => {
    it('should create shop from OAuth response', async () => {
      const shop = await createShopFromOAuth({
        shop: 'new-shop.myshopify.com',
        accessToken: 'shpat_xxx',
      })

      expect(shop.id).toBe('new-shop.myshopify.com')
      expect(shop.domain).toBe('new-shop.myshopify.com')
      expect(shop.isActive).toBe(true)
    })

    it('should update existing shop on re-install', async () => {
      await prisma.shop.create({
        data: {
          id: 'existing-shop.myshopify.com',
          domain: 'existing-shop.myshopify.com',
          isActive: false,
        }
      })

      const shop = await createShopFromOAuth({
        shop: 'existing-shop.myshopify.com',
        accessToken: 'new-token',
      })

      expect(shop.isActive).toBe(true)
    })
  })
})
