import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { getShop, saveShop } from '~/modules/shop'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shop = url.searchParams.get('shop')

  if (!shop) {
    return Response.json({ error: 'Missing shop parameter' }, { status: 400 })
  }

  const shopData = await getShop(shop)
  if (!shopData) {
    return Response.json({ error: 'Shop not found' }, { status: 404 })
  }

  // Return shop data without sensitive fields (twilioAuthToken)
  return Response.json({
    shop: {
      id: shopData.id,
      domain: shopData.domain,
      twilioAccountSid: shopData.twilioAccountSid,
      isActive: shopData.isActive,
      createdAt: shopData.createdAt,
    }
  })
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = await request.json()
  const { shop: shopDomain, twilioAccountSid, twilioAuthToken } = body

  if (!shopDomain || !twilioAccountSid || !twilioAuthToken) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // First get the existing shop to get its ID
    const existingShop = await getShop(shopDomain)
    if (!existingShop) {
      return Response.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Save shop with new credentials - encryption happens automatically
    await saveShop({
      id: existingShop.id,
      domain: existingShop.domain,
      twilioAccountSid,
      twilioAuthToken,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return Response.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
