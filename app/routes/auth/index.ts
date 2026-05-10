import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { redirect } from 'react-router'
import crypto from 'crypto'
import { buildShopifyAuthUrl, normalizeShopDomain } from '~/services/shopify.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shop = url.searchParams.get('shop')

  if (!shop) {
    return new Response('Missing shop parameter', { status: 400 })
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex')

  // Build and redirect to Shopify OAuth URL
  const authUrl = buildShopifyAuthUrl(shop, state)

  // Set state cookie for verification in callback
  return redirect(authUrl, {
    headers: {
      'Set-Cookie': `shopify_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  })
}
