import { prisma } from '~/db/client'

interface ProcessCheckoutWebhookInput {
  shopDomain: string
  payload: {
    token: string
    phone: string | null
    total_price: string
    line_items: Array<{ title: string; quantity: number }>
  }
}

interface ProcessCheckoutWebhookResult {
  success: boolean
  reason?: string
  abandonedCheckout?: {
    id: string
    checkoutToken: string
    scheduledTaskId: string
  }
}

interface ProcessAbandonedCartTaskInput {
  checkoutToken: string
  shopDomain: string
}

interface ProcessAbandonedCartTaskResult {
  success: boolean
  reason?: string
  messageLog?: {
    id: string
    status: string
  }
}

interface MarkCheckoutAsRecoveredInput {
  checkoutToken: string
  shopDomain: string
}

interface MarkCheckoutAsRecoveredResult {
  success: boolean
  reason?: string
}

export async function processCheckoutWebhook(
  input: ProcessCheckoutWebhookInput
): Promise<ProcessCheckoutWebhookResult> {
  const { shopDomain, payload } = input

  const phoneNumber = payload.phone
  if (!phoneNumber) {
    return { success: false, reason: 'NO_PHONE_NUMBER' }
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopDomain },
  })

  if (!shop) {
    return { success: false, reason: 'SHOP_NOT_FOUND' }
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

  const abandonedCheckout = await prisma.abandonedCheckout.create({
    data: {
      shopId: shopDomain,
      checkoutToken: payload.token,
      customerPhone: phoneNumber,
      totalPrice: payload.total_price,
      lineItems: JSON.stringify(payload.line_items),
      scheduledTaskId: `task_${payload.token}_${Date.now()}`,
    },
  })

  return {
    success: true,
    abandonedCheckout: {
      id: abandonedCheckout.id,
      checkoutToken: abandonedCheckout.checkoutToken,
      scheduledTaskId: abandonedCheckout.scheduledTaskId!,
    },
  }
}

export async function processAbandonedCartTask(
  input: ProcessAbandonedCartTaskInput
): Promise<ProcessAbandonedCartTaskResult> {
  const { checkoutToken, shopDomain } = input

  const abandonedCheckout = await prisma.abandonedCheckout.findUnique({
    where: {
      shopId_checkoutToken: {
        shopId: shopDomain,
        checkoutToken,
      },
    },
  })

  if (!abandonedCheckout) {
    return { success: false, reason: 'CHECKOUT_NOT_FOUND' }
  }

  if (abandonedCheckout.recoveredAt !== null) {
    return { success: true, reason: 'ALREADY_RECOVERED' }
  }

  const trackingUrl = `/track/${abandonedCheckout.id}?redirect=${encodeURIComponent(
    `https://${shopDomain}/cart/${checkoutToken}`
  )}`

  const messageLog = await prisma.messageLog.create({
    data: {
      shopId: shopDomain,
      type: 'ABANDONED_CART',
      phoneNumber: abandonedCheckout.customerPhone,
      templateId: 'abandoned_cart_v1',
      status: 'SENT',
      sentAt: new Date(),
      trackingUrl,
      abandonedCheckoutId: abandonedCheckout.id,
    },
  })

  return {
    success: true,
    messageLog: {
      id: messageLog.id,
      status: messageLog.status,
    },
  }
}

export async function markCheckoutAsRecovered(
  input: MarkCheckoutAsRecoveredInput
): Promise<MarkCheckoutAsRecoveredResult> {
  const { checkoutToken, shopDomain } = input

  const abandonedCheckout = await prisma.abandonedCheckout.findUnique({
    where: {
      shopId_checkoutToken: {
        shopId: shopDomain,
        checkoutToken,
      },
    },
  })

  if (!abandonedCheckout) {
    return { success: true, reason: 'CHECKOUT_NOT_FOUND' }
  }

  await prisma.abandonedCheckout.update({
    where: { id: abandonedCheckout.id },
    data: { recoveredAt: new Date() },
  })

  return { success: true }
}
