import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'

describe('Shop Model', () => {
  // Clean up database before each test
  beforeEach(async () => {
    await prisma.shop.deleteMany()
  })

  // Test 1: Can create a shop with minimal required fields
  it('should create a shop with required fields', async () => {
    const shop = await prisma.shop.create({
      data: {
        id: 'test-shop-1',
        domain: 'test-shop.myshopify.com',
      },
    })

    expect(shop.id).toBe('test-shop-1')
    expect(shop.domain).toBe('test-shop.myshopify.com')
    expect(shop.isActive).toBe(false) // default value
    expect(shop.createdAt).toBeInstanceOf(Date)
    expect(shop.twilioAccountSid).toBeNull()
    expect(shop.twilioAuthToken).toBeNull()
  })

  // Test 2: Can create a shop with all fields
  it('should create a shop with all fields', async () => {
    const shop = await prisma.shop.create({
      data: {
        id: 'test-shop-2',
        domain: 'full-shop.myshopify.com',
        twilioAccountSid: 'AC123456789',
        twilioAuthToken: 'auth_token_secret',
        isActive: true,
      },
    })

    expect(shop.id).toBe('test-shop-2')
    expect(shop.domain).toBe('full-shop.myshopify.com')
    expect(shop.twilioAccountSid).toBe('AC123456789')
    expect(shop.twilioAuthToken).toBe('auth_token_secret')
    expect(shop.isActive).toBe(true)
  })

  // Test 3: Domain must be unique
  it('should enforce unique domain constraint', async () => {
    await prisma.shop.create({
      data: {
        id: 'test-shop-3',
        domain: 'unique-domain.myshopify.com',
      },
    })

    await expect(
      prisma.shop.create({
        data: {
          id: 'test-shop-4',
          domain: 'unique-domain.myshopify.com',
        },
      })
    ).rejects.toThrow()
  })

  // Test 4: Can update shop fields
  it('should update shop fields', async () => {
    const shop = await prisma.shop.create({
      data: {
        id: 'test-shop-5',
        domain: 'update-shop.myshopify.com',
        isActive: false,
      },
    })

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: { isActive: true, twilioAccountSid: 'AC_updated' },
    })

    expect(updated.isActive).toBe(true)
    expect(updated.twilioAccountSid).toBe('AC_updated')
  })

  // Test 5: Can find shop by domain
  it('should find shop by domain', async () => {
    await prisma.shop.create({
      data: {
        id: 'test-shop-6',
        domain: 'find-shop.myshopify.com',
      },
    })

    const found = await prisma.shop.findUnique({
      where: { domain: 'find-shop.myshopify.com' },
    })

    expect(found).not.toBeNull()
    expect(found?.id).toBe('test-shop-6')
  })

  // Test 6: Can delete a shop
  it('should delete a shop', async () => {
    const shop = await prisma.shop.create({
      data: {
        id: 'test-shop-7',
        domain: 'delete-shop.myshopify.com',
      },
    })

    await prisma.shop.delete({ where: { id: shop.id } })

    const found = await prisma.shop.findUnique({ where: { id: shop.id } })
    expect(found).toBeNull()
  })
})
