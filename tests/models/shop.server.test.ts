import { describe, it, expect, beforeEach } from 'vitest'
import {
  createShop,
  getShopById,
  getShopByDomain,
  updateShop,
  deleteShop,
} from '~/models/shop.server'

describe('Shop Repository', () => {
  beforeEach(async () => {
    const { prisma } = await import('~/db/client')
    await prisma.shop.deleteMany()
  })

  it('should create and retrieve a shop by id', async () => {
    const created = await createShop({
      id: 'shop-1',
      domain: 'test.myshopify.com',
    })

    const found = await getShopById('shop-1')

    expect(found).not.toBeNull()
    expect(found?.id).toBe('shop-1')
    expect(found?.domain).toBe('test.myshopify.com')
  })

  it('should retrieve a shop by domain', async () => {
    await createShop({
      id: 'shop-2',
      domain: 'by-domain.myshopify.com',
    })

    const found = await getShopByDomain('by-domain.myshopify.com')

    expect(found?.id).toBe('shop-2')
  })

  it('should create shop with all twilio fields', async () => {
    const created = await createShop({
      id: 'shop-3',
      domain: 'twilio.myshopify.com',
      twilioAccountSid: 'AC123',
      twilioAuthToken: 'token456',
      isActive: true,
    })

    expect(created.twilioAccountSid).toBe('AC123')
    expect(created.twilioAuthToken).toBe('token456')
    expect(created.isActive).toBe(true)
  })

  it('should update shop fields', async () => {
    await createShop({
      id: 'shop-4',
      domain: 'update.myshopify.com',
      isActive: false,
    })

    const updated = await updateShop('shop-4', {
      isActive: true,
      twilioAccountSid: 'AC_new',
    })

    expect(updated.isActive).toBe(true)
    expect(updated.twilioAccountSid).toBe('AC_new')
  })

  it('should delete a shop', async () => {
    await createShop({
      id: 'shop-5',
      domain: 'delete.myshopify.com',
    })

    await deleteShop('shop-5')

    const found = await getShopById('shop-5')
    expect(found).toBeNull()
  })
})
