import type { LoaderFunctionArgs } from 'react-router'
import { calculateRecoveredRevenue } from '~/services/attribution.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const shopId = url.searchParams.get('shopId')

  if (!shopId) {
    return Response.json({ error: 'Missing shopId parameter' }, { status: 400 })
  }

  const result = await calculateRecoveredRevenue(shopId)

  return Response.json({
    shopId,
    totalRecovered: result.totalRecovered,
    orderCount: result.orderCount,
  })
}
