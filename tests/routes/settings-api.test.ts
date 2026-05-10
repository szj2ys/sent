import { describe, it, expect, beforeEach } from 'vitest'
import { loader, action } from '~/routes/api/settings'
import { setShopStorage, mockShopStorage } from '~/modules/shop'

describe('Settings API Route', () => {
  beforeEach(() => {
    setShopStorage(mockShopStorage())
  })

  describe('loader', () => {
    it('returns shop settings when found by domain', async () => {
      // Setup: Create a shop via saveShop
      const { saveShop } = await import('~/modules/shop')
      await saveShop({
        id: 'test-shop-id',
        domain: 'test.myshopify.com',
        twilioAccountSid: 'AC1234567890',
        twilioAuthToken: 'secret-token',
        isActive: true,
      })

      // Execute: Call loader with shop domain
      const request = new Request('http://localhost/api/settings?shop=test.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      // Verify: Returns shop data without sensitive fields
      expect(response.status).toBe(200)
      expect(data.shop).toBeDefined()
      expect(data.shop.id).toBe('test-shop-id')
      expect(data.shop.domain).toBe('test.myshopify.com')
      expect(data.shop.twilioAccountSid).toBe('AC1234567890')
      expect(data.shop.isActive).toBe(true)
      // Should NOT expose twilioAuthToken
      expect(data.shop.twilioAuthToken).toBeUndefined()
    })

    it('returns 400 when shop parameter is missing', async () => {
      const request = new Request('http://localhost/api/settings')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing shop parameter')
    })

    it('returns 404 when shop not found', async () => {
      const request = new Request('http://localhost/api/settings?shop=nonexistent.myshopify.com')
      const response = await loader({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Shop not found')
    })
  })
})

  describe('action', () => {
    it('updates shop credentials successfully', async () => {
      // Setup: Create a shop via saveShop
      const { saveShop, getShop } = await import('~/modules/shop')
      await saveShop({
        id: 'test-shop-id',
        domain: 'test.myshopify.com',
        isActive: true,
      })

      // Execute: Call action to update credentials
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: 'test.myshopify.com',
          twilioAccountSid: 'AC_new_sid',
          twilioAuthToken: 'new_secret_token',
        }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      // Verify: Returns success
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify: Shop is updated via getShop
      const updatedShop = await getShop('test.myshopify.com')
      expect(updatedShop?.twilioAccountSid).toBe('AC_new_sid')
      expect(updatedShop?.twilioAuthToken).toBe('new_secret_token')
    })

    it('returns 405 for non-POST requests', async () => {
      const request = new Request('http://localhost/api/settings', { method: 'GET' })
      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('returns 400 when required fields are missing', async () => {
      const request = new Request('http://localhost/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: 'test.myshopify.com',
          // Missing twilio fields
        }),
      })

      const response = await action({ request, params: {}, context: {} } as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })
  })
