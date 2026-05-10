import type { ActionFunctionArgs } from 'react-router'
import { processCheckoutWebhook } from '~/services/abandoned-cart.server'
import crypto from 'crypto'

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || ''

function verifyShopifyHmac(body: string, hmac: string): boolean {
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

  const result = await processCheckoutWebhook({
    shopDomain,
    payload: {
      token: payload.token,
      phone: payload.phone,
      total_price: payload.total_price,
      line_items: payload.line_items,
    }
  })

  // Return 200 even if we skip (silent skip)
  return Response.json(result, { status: 200 })
}
