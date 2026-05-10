// Shop Module Types
// Core invariant: twilioAuthToken is always plaintext in application code

export type Shop = {
  id: string
  domain: string
  twilioAccountSid: string | null
  twilioAuthToken: string | null
  isActive: boolean
  createdAt: Date
}

export type ShopInput = {
  id: string
  domain: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  isActive?: boolean
}

// Storage adapter interface - implementations handle persistence details
export interface ShopStorage {
  findByIdOrDomain(idOrDomain: string): Promise<Shop | null>
  upsert(shop: ShopInput): Promise<Shop>
}
