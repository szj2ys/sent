import { prisma } from '~/db/client'

interface TrackLinkClickInput {
  abandonedCheckoutId: string
}

interface TrackLinkClickResult {
  success: boolean
  reason?: string
  redirectUrl?: string
}

interface ProcessOrderAttributionInput {
  shopDomain: string
  orderId: string
  checkoutToken: string
  totalPrice: string
  customerPhone: string
}

interface ProcessOrderAttributionResult {
  success: boolean
  reason?: string
  orderAttribution?: {
    id: string
    orderId: string
  }
}

interface RecoveredRevenueResult {
  totalRecovered: number
  orderCount: number
}

export async function trackLinkClick(
  input: TrackLinkClickInput
): Promise<TrackLinkClickResult> {
  const { abandonedCheckoutId } = input

  const checkout = await prisma.abandonedCheckout.findUnique({
    where: { id: abandonedCheckoutId },
    include: { shop: true, messageLogs: true },
  })

  if (!checkout) {
    return { success: false, reason: 'CHECKOUT_NOT_FOUND' }
  }

  // Update all related message logs
  for (const messageLog of checkout.messageLogs) {
    await prisma.messageLog.update({
      where: { id: messageLog.id },
      data: {
        clickCount: { increment: 1 },
        clickedAt: new Date(),
      },
    })
  }

  const redirectUrl = `https://${checkout.shop.domain}/cart/${checkout.checkoutToken}`

  return {
    success: true,
    redirectUrl,
  }
}

export async function processOrderAttribution(
  input: ProcessOrderAttributionInput
): Promise<ProcessOrderAttributionResult> {
  const { shopDomain, orderId, checkoutToken, totalPrice, customerPhone } = input

  const checkout = await prisma.abandonedCheckout.findUnique({
    where: {
      shopId_checkoutToken: {
        shopId: shopDomain,
        checkoutToken,
      },
    },
    include: { messageLogs: true },
  })

  if (!checkout) {
    return { success: false, reason: 'CHECKOUT_NOT_FOUND' }
  }

  // Find message log with clicks
  const messageLogWithClick = checkout.messageLogs.find(
    (log) => log.clickCount > 0
  )

  if (!messageLogWithClick) {
    return { success: false, reason: 'NO_CLICK_ATTRIBUTION' }
  }

  // Create order attribution
  const attribution = await prisma.orderAttribution.create({
    data: {
      shopId: shopDomain,
      orderId,
      messageLogId: messageLogWithClick.id,
      abandonedCheckoutId: checkout.id,
      recoveredAmount: totalPrice,
      customerPhone,
    },
  })

  // Mark checkout as recovered
  await prisma.abandonedCheckout.update({
    where: { id: checkout.id },
    data: { 
      recoveredAt: new Date(),
      orderId,
    },
  })

  return {
    success: true,
    orderAttribution: {
      id: attribution.id,
      orderId: attribution.orderId,
    },
  }
}

export async function calculateRecoveredRevenue(
  shopId: string
): Promise<RecoveredRevenueResult> {
  const attributions = await prisma.orderAttribution.findMany({
    where: { shopId },
  })

  const totalRecovered = attributions.reduce((sum, attr) => {
    return sum + parseFloat(attr.recoveredAmount)
  }, 0)

  return {
    totalRecovered,
    orderCount: attributions.length,
  }
}
