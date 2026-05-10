import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { action } from '~/routes/api/consent'

describe('POST /api/consent', () => {
  beforeEach(async () => {
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  it('should collect consent via API endpoint', async () => {
    // Setup: Create a shop
    await prisma.shop.create({
      data: {
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
      }
    })

    // Execute: Call API endpoint
    const request = new Request('http://localhost/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopDomain: 'test-shop.myshopify.com',
        phoneNumber: '+1234567890',
      }),
    })

    const response = await action({ request } as any)
    const data = await response.json()

    // Verify: Returns success
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.consent.phoneNumber).toBe('+1234567890')

    // Verify: Stored in database
    const saved = await prisma.customerConsent.findMany()
    expect(saved).toHaveLength(1)
    expect(saved[0].phoneNumber).toBe('+1234567890')
  })

  it('should return 404 when shop does not exist', async () => {
    const request = new Request('http://localhost/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopDomain: 'non-existent.myshopify.com',
        phoneNumber: '+1234567890',
      }),
    })

    const response = await action({ request } as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('SHOP_NOT_FOUND')
  })

  it('should return 400 when phone number is invalid', async () => {
    // Setup: Create a shop
    await prisma.shop.create({
      data: {
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
      }
    })

    const request = new Request('http://localhost/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopDomain: 'test-shop.myshopify.com',
        phoneNumber: 'invalid-phone',
      }),
    })

    const response = await action({ request } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('INVALID_PHONE_NUMBER')
  })

  it('should return 400 when required fields are missing', async () => {
    const request = new Request('http://localhost/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopDomain: 'test-shop.myshopify.com',
        // missing phoneNumber
      }),
    })

    const response = await action({ request } as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 405 for non-POST methods', async () => {
    const request = new Request('http://localhost/api/consent', {
      method: 'GET',
    })

    const response = await action({ request } as any)

    expect(response.status).toBe(405)
  })
})
