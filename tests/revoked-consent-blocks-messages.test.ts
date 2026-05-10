import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '~/db/client'
import { processOrderWebhook } from '~/services/order.server'

describe('Revoked Consent Blocks Messages', () => {
  beforeEach(async () => {
    await prisma.messageLog.deleteMany()
    await prisma.customerConsent.deleteMany()
    await prisma.shop.deleteMany()
  })

  it('should not send message when consent is revoked', async () => {
    // Setup: Create shop with Twilio config
    await prisma.shop.create({
      data: {
        id: 'test-shop.myshopify.com',
        domain: 'test-shop.myshopify.com',
        isActive: true,
        twilioAccountSid: 'AC_test_account',
        twilioAuthToken: 'encrypted_token',
      }
    })

    // Setup: Create revoked consent
    await prisma.customerConsent.create({
      data: {
        id: 'consent-1',
        shopId: 'test-shop.myshopify.com',
        phoneNumber: '+1234567890',
        consentedAt: new Date('2023-01-01'),
        revokedAt: new Date('2024-01-01'),
      }
    })

    // Execute: Process order webhook
    const webhookPayload = {
      id: 12345,
      name: '#1001',
      customer: {
        phone: '+1234567890',
        first_name: 'John',
      },
      total_price: '99.99',
      line_items: [{ title: 'Test Product', quantity: 1 }],
    }

    const result = await processOrderWebhook({
      shopDomain: 'test-shop.myshopify.com',
      payload: webhookPayload,
    })

    // Verify: Message was not sent
    expect(result.success).toBe(false)
    expect(result.reason).toBe('NO_CONSENT')

    // Verify: No message log created
    const logs = await prisma.messageLog.findMany()
    expect(logs).toHaveLength(0)
  })
})
