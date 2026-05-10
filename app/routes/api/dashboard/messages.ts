import type { LoaderFunctionArgs } from 'react-router'
import { prisma } from '~/db/client'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shopId = url.searchParams.get('shopId')

  if (!shopId) {
    return Response.json({ error: 'Missing shopId parameter' }, { status: 400 })
  }

  const messages = await prisma.messageLog.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      type: true,
      phoneNumber: true,
      status: true,
      sentAt: true,
      deliveredAt: true,
      clickCount: true,
      createdAt: true,
    },
  })

  // Mask phone numbers for privacy
  const maskedMessages = messages.map(msg => ({
    ...msg,
    phoneNumber: maskPhoneNumber(msg.phoneNumber),
  }))

  return Response.json({
    shopId,
    messages: maskedMessages,
  })
}

function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return phone
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)
}
