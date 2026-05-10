import type { ActionFunctionArgs } from 'react-router'
import { collectConsent } from '~/services/consent.server'

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = await request.json()
  const { shopDomain, phoneNumber } = body

  if (!shopDomain || !phoneNumber) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await collectConsent({ shopDomain, phoneNumber })

  if (!result.success) {
    return Response.json(
      { error: result.error },
      { status: result.error === 'SHOP_NOT_FOUND' ? 404 : 400 }
    )
  }

  return Response.json({ success: true, consent: result.consent })
}
