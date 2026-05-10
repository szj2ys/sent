import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { prisma } from '~/db/client'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shopId = url.searchParams.get('shopId')

  if (!shopId) {
    return Response.json({ error: 'Missing shopId parameter' }, { status: 400 })
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      enableAbandonedCart: true,
      enableOrderConfirmation: true,
    },
  })

  if (!shop) {
    return Response.json({ error: 'Shop not found' }, { status: 404 })
  }

  return Response.json({
    shopId: shop.id,
    enableAbandonedCart: shop.enableAbandonedCart,
    enableOrderConfirmation: shop.enableOrderConfirmation,
  })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  
  const shopId = formData.get('shopId')
  const enableAbandonedCart = formData.get('enableAbandonedCart')
  const enableOrderConfirmation = formData.get('enableOrderConfirmation')

  if (typeof shopId !== 'string' || !shopId) {
    return Response.json({ error: 'Missing shopId' }, { status: 400 })
  }

  const updateData: { enableAbandonedCart?: boolean; enableOrderConfirmation?: boolean } = {}

  if (enableAbandonedCart !== null) {
    updateData.enableAbandonedCart = enableAbandonedCart === 'true'
  }
  
  if (enableOrderConfirmation !== null) {
    updateData.enableOrderConfirmation = enableOrderConfirmation === 'true'
  }

  await prisma.shop.update({
    where: { id: shopId },
    data: updateData,
  })

  return Response.json({ success: true })
}
