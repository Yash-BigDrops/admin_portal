export type OfferVisibility = 'hidden' | 'internal' | 'public'

export type OfferStatus = 'active' | 'paused' | 'disabled'

export type Offer = {
  id: string
  everflow_offer_id: string
  name: string
  status: OfferStatus
  visibility: OfferVisibility
  advertiser_id: string | null
  advertiser_name: string | null
  geo_targets: string[] | null
  data: any
  created_at: string
  updated_at: string
}

export type OfferInfo = {
  id: string
  name: string
  status: string
  advertiserId: string | null
  advertiserName: string | null
  payout: number | null
  currency: string | null
  geoTargets: string[] | null
  raw: any
}

export type SortOption = 'id_desc' | 'id_asc' | 'name_asc' | 'name_desc'

export type ListOffersOptions = {
  sort?: SortOption
  limit?: number
  offset?: number
  status?: string
  visibility?: OfferVisibility | null
}

export type CreateManualOfferInput = {
  offerId: string
  name: string
  advertiserId?: string | null
  advertiserName?: string | null
  status?: OfferStatus
  visibility?: OfferVisibility
  brandGuidelinesUrl?: string | null
  notes?: string | null
}

export type UpdateOfferDetailsInput = {
  visibility?: OfferVisibility
  brandGuidelinesUrl?: string | null
  notes?: string | null
  advertiserId?: string | null
  advertiserName?: string | null
}

