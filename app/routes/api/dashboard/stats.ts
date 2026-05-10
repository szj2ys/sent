import type { LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/db/client'
import { calculateRecoveredRevenue } from '~/services/attribution.server'

const FREE_QUOTA = 200

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shopId = url.searchParams.get('shopId')

  if (!shopId) {
    return Response.json({ error: 'Missing shopId parameter' }, { status: 400 })
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  })

  if (!shop) {
    return Response.json({ error: 'Shop not found' }, { status: 404 })
  }

  // Calculate stats for this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const messagesThisMonth = await prisma.messageLog.findMany({
    where: {
      shopId,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  })

  const messagesSentThisMonth = messagesThisMonth.length
  const messagesDelivered = messagesThisMonth.filter(m => m.status === 'DELIVERED').length
  const deliveryRate = messagesSentThisMonth > 0
    ? Math.round((messagesDelivered / messagesSentThisMonth) * 100)
    : 0

  const messagesWithClicks = messagesThisMonth.filter(m => m.clickCount > 0).length
  const clickThroughRate = messagesSentThisMonth > 0
    ? Math.round((messagesWithClicks / messagesSentThisMonth) * 100)
    : 0

  const remainingQuota = Math.max(0, FREE_QUOTA - messagesSentThisMonth)

  // Get recovered revenue data
  const recoveredRevenue = await calculateRecoveredRevenue(shopId)

  return Response.json({
    shopId,
    messagesSentThisMonth,
    messagesDelivered,
    remainingQuota,
    deliveryRate,
    clickThroughRate,
    totalRecoveredOrders: recoveredRevenue.orderCount,
    totalRecoveredRevenue: recoveredRevenue.totalRecovered,
  })
}
