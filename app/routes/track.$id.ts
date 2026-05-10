import type { LoaderFunctionArgs } from 'react-router'
import { trackLinkClick } from '~/services/attribution.server'

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params

  if (!id) {
    return new Response('Not Found', { status: 404 })
  }

  const result = await trackLinkClick({ abandonedCheckoutId: id })

  if (!result.success) {
    return new Response('Not Found', { status: 404 })
  }

  // Redirect to the cart
  return new Response(null, {
    status: 302,
    headers: {
      Location: result.redirectUrl!,
    },
  })
}
