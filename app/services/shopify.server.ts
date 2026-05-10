import crypto from 'crypto'
import { prisma } from '~/db/client'

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY ?? ''
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET ?? ''
const SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL ?? 'http://localhost:3000'

export function normalizeShopDomain(shop: string): string {
  let domain = shop.toLowerCase().trim()
  if (!domain.includes('.')) {
    domain = `${domain}.myshopify.com`
  }
  return domain.replace(/\.myshopify\.com$/, '.myshopify.com')
}

export function buildShopifyAuthUrl(shop: string, state: string): string {
  const normalizedShop = normalizeShopDomain(shop)
  const redirectUri = `${SHOPIFY_APP_URL}/auth/callback`
  const scopes = 'read_orders,read_products,read_customers'
  
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  })
  
  return `https://${normalizedShop}/admin/oauth/authorize?${params.toString()}`
}

export function verifyShopifyHmac(queryString: string): boolean {
  const params = new URLSearchParams(queryString)
  const hmac = params.get('hmac')
  
  if (!hmac) {
    return false
  }
  
  params.delete('hmac')
  params.delete('signature')
  
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const message = sortedParams.map(([key, value]) => `${key}=${value}`).join('&')
  
  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex')
  
  const hmacBuffer = Buffer.from(hmac)
  const generatedBuffer = Buffer.from(generatedHmac)
  
  if (hmacBuffer.length !== generatedBuffer.length) {
    return false
  }
  
  return crypto.timingSafeEqual(hmacBuffer, generatedBuffer)
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<string> {
  const normalizedShop = normalizeShopDomain(shop)
  const url = `https://${normalizedShop}/admin/oauth/access_token`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.status}`)
  }
  
  const data = await response.json() as { access_token: string }
  return data.access_token
}

export async function createShopFromOAuth({
  shop,
  accessToken,
}: {
  shop: string
  accessToken: string
}): Promise<{
  id: string
  domain: string
  isActive: boolean
  createdAt: Date
}> {
  const normalizedShop = normalizeShopDomain(shop)
  
  const existing = await prisma.shop.findUnique({
    where: { id: normalizedShop },
  })
  
  if (existing) {
    return prisma.shop.update({
      where: { id: normalizedShop },
      data: { isActive: true },
    })
  }
  
  return prisma.shop.create({
    data: {
      id: normalizedShop,
      domain: normalizedShop,
      isActive: true,
    },
  })
}
