import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loader } from '~/routes/auth/callback'
import { setShopStorage, getShop, saveShop } from '~/modules/shop'
import { mockShopStorage } from '~/modules/shop'
import { verifyShopifyHmac, exchangeCodeForToken } from '~/services/shopify.server'

// Mock the shopify service
vi.mock('~/services/shopify.server', () => ({
  verifyShopifyHmac: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  normalizeShopDomain: (shop: string) => {
    let domain = shop.toLowerCase().trim()
    if (!domain.includes('.')) {
      domain = `${domain}.myshopify.com`
    }
    return domain.replace(/\.myshopify\.com$/, '.myshopify.com')
  },
}))

describe('OAuth Callback Route', () => {
  beforeEach(() => {
    setShopStorage(mockShopStorage())
    vi.resetAllMocks()
  })

  it('should create new shop on OAuth callback', async () => {
    // Setup: Mock successful HMAC verification and token exchange
    vi.mocked(verifyShopifyHmac).mockReturnValue(true)
    vi.mocked(exchangeCodeForToken).mockResolvedValue('shpat_xxx')

    // Execute: Simulate OAuth callback request
    const request = new Request('http://localhost/auth/callback?shop=test-shop.myshopify.com&code=auth-code&hmac=valid')
    const response = await loader({ request } as any)

    // Verify: Should redirect to app
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/app?shop=test-shop.myshopify.com')

    // Verify: Shop was created
    const shop = await getShop('test-shop.myshopify.com')
    expect(shop).not.toBeNull()
    expect(shop?.domain).toBe('test-shop.myshopify.com')
    expect(shop?.isActive).toBe(true)
  })

  it('should update existing shop on re-install', async () => {
    // Setup: Create existing inactive shop
    await saveShop({
      id: 'existing-shop.myshopify.com',
      domain: 'existing-shop.myshopify.com',
      isActive: false,
    })
    vi.mocked(verifyShopifyHmac).mockReturnValue(true)
    vi.mocked(exchangeCodeForToken).mockResolvedValue('new-token')

    // Execute: OAuth callback for existing shop
    const request = new Request('http://localhost/auth/callback?shop=existing-shop.myshopify.com&code=auth-code&hmac=valid')
    const response = await loader({ request } as any)

    // Verify: Should redirect successfully
    expect(response.status).toBe(302)

    // Verify: Shop is now active
    const shop = await getShop('existing-shop.myshopify.com')
    expect(shop?.isActive).toBe(true)
  })

  it('should reject invalid HMAC signature', async () => {
    vi.mocked(verifyShopifyHmac).mockReturnValue(false)

    const request = new Request('http://localhost/auth/callback?shop=test.myshopify.com&code=xxx&hmac=invalid')
    const response = await loader({ request } as any)

    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toBe('Invalid HMAC signature')
  })

  it('should reject missing shop or code', async () => {
    vi.mocked(verifyShopifyHmac).mockReturnValue(true)

    const requestNoShop = new Request('http://localhost/auth/callback?code=xxx&hmac=valid')
    const responseNoShop = await loader({ request: requestNoShop } as any)
    expect(responseNoShop.status).toBe(400)

    const requestNoCode = new Request('http://localhost/auth/callback?shop=test.myshopify.com&hmac=valid')
    const responseNoCode = await loader({ request: requestNoCode } as any)
    expect(responseNoCode.status).toBe(400)
  })

  it('should handle authentication failure gracefully', async () => {
    vi.mocked(verifyShopifyHmac).mockReturnValue(true)
    vi.mocked(exchangeCodeForToken).mockRejectedValue(new Error('Invalid code'))

    const request = new Request('http://localhost/auth/callback?shop=test.myshopify.com&code=invalid&hmac=valid')
    const response = await loader({ request } as any)

    expect(response.status).toBe(500)
    const text = await response.text()
    expect(text).toBe('Authentication failed')
  })
})
