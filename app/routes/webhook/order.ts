import type { ActionFunctionArgs } from 'react-router'
import { processOrderWebhook } from '~/services/order.server'
import { processOrderAttribution } from '~/services/attribution.server'
import crypto from 'crypto'

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || ''

function verifyShopifyHmac(body: string, hmac: string): boolean {
  // In test environment, skip HMAC verification
  if (process.env.NODE_ENV === 'test') {
    return true
  }
  const calculated = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64')
  return calculated === hmac
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = await request.text()
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256')
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain')

  if (!hmac || !shopDomain) {
    return Response.json({ error: 'Missing headers' }, { status: 400 })
  }

  if (!verifyShopifyHmac(body, hmac)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // Process order confirmation message
  const result = await processOrderWebhook({
    shopDomain,
    payload: {
      id: payload.id,
      name: payload.name,
      customer: payload.customer,
      total_price: payload.total_price,
      line_items: payload.line_items,
    }
  })

  // Process order attribution if checkout token exists
  if (payload.checkout_token) {
    const customerPhone = payload.customer?.phone
    if (customerPhone) {
      await processOrderAttribution({
        shopDomain,
        orderId: String(payload.id),
        checkoutToken: payload.checkout_token,
        totalPrice: payload.total_price,
        customerPhone,
      })
    }
  }

  return Response.json(result, { status: 200 })
}
