import type { LoaderFunctionArgs } from 'react-router'
import { redirect } from 'react-router'
import { verifyShopifyHmac, exchangeCodeForToken, normalizeShopDomain } from '~/services/shopify.server'
import { getShop, saveShop } from '~/modules/shop'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const queryString = url.search.slice(1) // Remove leading '?'
  
  // Verify HMAC signature
  if (!verifyShopifyHmac(queryString)) {
    return new Response('Invalid HMAC signature', { status: 400 })
  }

  const shop = url.searchParams.get('shop')
  const code = url.searchParams.get('code')

  if (!shop || !code) {
    return new Response('Missing required parameters', { status: 400 })
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(shop, code)

    // Create or update shop using the new Shop Module
    const normalizedDomain = normalizeShopDomain(shop)
    const existingShop = await getShop(normalizedDomain)
    
    await saveShop({
      id: normalizedDomain,
      domain: normalizedDomain,
      isActive: true,
    })

    // Redirect to embedded app
    const redirectUrl = `/app?shop=${encodeURIComponent(shop)}`
    return redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response('Authentication failed', { status: 500 })
  }
}
