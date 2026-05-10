import { prisma } from '~/db/client'
import { getShop } from '~/modules/shop'

interface ProcessOrderWebhookInput {
  shopDomain: string
  payload: {
    id: number
    name: string
    customer: {
      phone: string | null
      first_name: string | null
    } | null
    total_price: string
    line_items: Array<{ title: string; quantity: number }>
  }
}

interface ProcessOrderWebhookResult {
  success: boolean
  reason?: string
  messageLog?: {
    id: string
    status: string
  }
}

async function logMessageFailure(
  shopId: string,
  phoneNumber: string,
  failedReason: string
) {
  return prisma.messageLog.create({
    data: {
      shopId,
      type: 'ORDER_CONFIRMATION',
      phoneNumber,
      templateId: 'order_confirmation_v1',
      status: 'FAILED',
      failedReason,
    },
  })
}

async function logMessageSuccess(
  shopId: string,
  phoneNumber: string
) {
  return prisma.messageLog.create({
    data: {
      shopId,
      type: 'ORDER_CONFIRMATION',
      phoneNumber,
      templateId: 'order_confirmation_v1',
      status: 'SENT',
      sentAt: new Date(),
    },
  })
}

export async function processOrderWebhook(
  input: ProcessOrderWebhookInput
): Promise<ProcessOrderWebhookResult> {
  const { shopDomain, payload } = input

  const phoneNumber = payload.customer?.phone
  if (!phoneNumber) {
    return { success: false, reason: 'NO_PHONE_NUMBER' }
  }

  const consent = await prisma.customerConsent.findUnique({
    where: {
      shopId_phoneNumber: {
        shopId: shopDomain,
        phoneNumber: phoneNumber,
      },
    },
  })

  if (!consent || consent.revokedAt !== null) {
    return { success: false, reason: 'NO_CONSENT' }
  }

  const shop = await getShop(shopDomain)

  if (!shop || !shop.twilioAccountSid || !shop.twilioAuthToken) {
    const log = await logMessageFailure(
      shopDomain,
      phoneNumber,
      'Missing Twilio configuration'
    )
    return {
      success: false,
      reason: 'CONFIG_ERROR',
      messageLog: { id: log.id, status: log.status }
    }
  }

  try {
    const log = await logMessageSuccess(shopDomain, phoneNumber)
    return {
      success: true,
      messageLog: { id: log.id, status: log.status },
    }
  } catch (error) {
    const log = await logMessageFailure(
      shopDomain,
      phoneNumber,
      error instanceof Error ? error.message : 'Unknown error'
    )
    return {
      success: false,
      reason: 'SEND_FAILED',
      messageLog: { id: log.id, status: log.status }
    }
  }
}
