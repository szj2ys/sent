import { prisma } from '~/db/client'
import { encrypt, decrypt } from '~/utils/encryption'

export type { Shop } from '@prisma/client'

export async function getShopById(id: string) {
  return prisma.shop.findUnique({ where: { id } })
}

export async function getShopByDomain(domain: string) {
  return prisma.shop.findUnique({ where: { domain } })
}

export async function createShop({
  id,
  domain,
  twilioAccountSid,
  twilioAuthToken,
  isActive = false,
}: {
  id: string
  domain: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  isActive?: boolean
}) {
  return prisma.shop.create({
    data: {
      id,
      domain,
      twilioAccountSid,
      twilioAuthToken,
      isActive,
    },
  })
}

export async function updateShop(
  id: string,
  data: Partial<{
    domain: string
    twilioAccountSid: string | null
    twilioAuthToken: string | null
    isActive: boolean
  }>
) {
  return prisma.shop.update({
    where: { id },
    data,
  })
}

export async function deleteShop(id: string) {
  return prisma.shop.delete({ where: { id } })
}

export async function createShopWithEncryptedToken({
  id,
  domain,
  twilioAccountSid,
  twilioAuthToken,
  isActive = false,
}: {
  id: string
  domain: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  isActive?: boolean
}) {
  return prisma.shop.create({
    data: {
      id,
      domain,
      twilioAccountSid,
      twilioAuthToken: twilioAuthToken ? encrypt(twilioAuthToken) : null,
      isActive,
    },
  })
}

export async function updateShopTwilioCredentials(
  idOrDomain: string,
  {
    twilioAccountSid,
    twilioAuthToken,
  }: {
    twilioAccountSid: string
    twilioAuthToken: string
  }
) {
  const existingShop = await prisma.shop.findFirst({
    where: {
      OR: [{ id: idOrDomain }, { domain: idOrDomain }],
    },
  })

  if (!existingShop) {
    throw new Error('Shop not found')
  }

  return prisma.shop.update({
    where: { id: existingShop.id },
    data: {
      twilioAccountSid,
      twilioAuthToken: encrypt(twilioAuthToken),
    },
  })
}

export async function getShopWithDecryptedToken(id: string) {
  const shop = await prisma.shop.findUnique({ where: { id } })
  if (!shop) {
    return null
  }

  return {
    ...shop,
    twilioAuthToken: shop.twilioAuthToken ? decrypt(shop.twilioAuthToken) : null,
  }
}
