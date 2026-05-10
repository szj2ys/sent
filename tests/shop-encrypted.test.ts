import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { createShopWithEncryptedToken, updateShopTwilioCredentials, getShopWithDecryptedToken } from '~/models/shop.server'

describe('Shop with encrypted Twilio Auth Token', () => {
  beforeEach(async () => {
    await prisma.shop.deleteMany()
  })

  it('should encrypt twilioAuthToken when creating shop', async () => {
    const shop = await createShopWithEncryptedToken({
      id: 'shop-1',
      domain: 'test.myshopify.com',
      twilioAccountSid: 'AC123',
      twilioAuthToken: 'my-secret-token',
    })

    expect(shop.twilioAccountSid).toBe('AC123')
    expect(shop.twilioAuthToken).not.toBe('my-secret-token')
    expect(shop.twilioAuthToken).toContain(':') // encrypted format
  })

  it('should decrypt twilioAuthToken when retrieving shop', async () => {
    await createShopWithEncryptedToken({
      id: 'shop-2',
      domain: 'test2.myshopify.com',
      twilioAccountSid: 'AC456',
      twilioAuthToken: 'another-secret',
    })

    const shop = await getShopWithDecryptedToken('shop-2')

    expect(shop?.twilioAuthToken).toBe('another-secret')
  })

  it('should encrypt twilioAuthToken when updating credentials', async () => {
    await prisma.shop.create({
      data: {
        id: 'shop-3',
        domain: 'test3.myshopify.com',
      }
    })

    const updated = await updateShopTwilioCredentials('shop-3', {
      twilioAccountSid: 'AC789',
      twilioAuthToken: 'updated-secret',
    })

    expect(updated.twilioAccountSid).toBe('AC789')
    expect(updated.twilioAuthToken).not.toBe('updated-secret')
    expect(updated.twilioAuthToken).toContain(':') // encrypted
  })

  it('should handle null/undefined auth token gracefully', async () => {
    const shop = await createShopWithEncryptedToken({
      id: 'shop-4',
      domain: 'test4.myshopify.com',
      twilioAccountSid: 'AC000',
    })

    expect(shop.twilioAuthToken).toBeNull()

    const retrieved = await getShopWithDecryptedToken('shop-4')
    expect(retrieved?.twilioAuthToken).toBeNull()
  })
})
