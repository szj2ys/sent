import { prisma } from '~/db/client'

interface CollectConsentInput {
  shopDomain: string
  phoneNumber: string
}

interface CollectConsentResult {
  success: boolean
  consent?: {
    id: string
    phoneNumber: string
    consentedAt: Date
  }
  error?: string
}

// E.164 format: + followed by 1-15 digits
const E164_REGEX = /^\+[1-9]\d{1,14}$/

export async function collectConsent(
  input: CollectConsentInput
): Promise<CollectConsentResult> {
  const { shopDomain, phoneNumber } = input

  if (!E164_REGEX.test(phoneNumber)) {
    return { success: false, error: 'INVALID_PHONE_NUMBER' }
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopDomain },
  })

  if (!shop) {
    return { success: false, error: 'SHOP_NOT_FOUND' }
  }

  const consent = await prisma.customerConsent.upsert({
    where: {
      shopId_phoneNumber: {
        shopId: shopDomain,
        phoneNumber: phoneNumber,
      }
    },
    create: {
      shopId: shopDomain,
      phoneNumber: phoneNumber,
      consentedAt: new Date(),
    },
    update: {
      consentedAt: new Date(),
      revokedAt: null,
    },
  })

  return {
    success: true,
    consent: {
      id: consent.id,
      phoneNumber: consent.phoneNumber,
      consentedAt: consent.consentedAt,
    }
  }
}
