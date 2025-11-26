import {
  listOffers,
  getOfferById,
  createManualOffer,
  updateOfferVisibility,
  updateOfferDetails,
  upsertOffersFromEverflow,
  getOfferData,
  bulkUpdateOffers as bulkUpdateOffersRepo,
} from './offers.repository'
import { fetchEverflowOffers } from './offers.everflow'
import type {
  Offer,
  OfferVisibility,
  ListOffersOptions,
  CreateManualOfferInput,
  UpdateOfferDetailsInput,
} from './offers.types'

export async function getOffersForAdminPage(
  options: ListOffersOptions = {},
): Promise<Offer[]> {
  return listOffers(options)
}

export async function getOfferDetails(id: string): Promise<Offer | null> {
  return getOfferById(id)
}

export async function createOffer(
  input: CreateManualOfferInput,
): Promise<Offer> {
  return createManualOffer(input)
}

export async function updateOffer(
  id: string,
  input: UpdateOfferDetailsInput,
): Promise<Offer> {
  const offerData = await getOfferData(id)
  if (!offerData) {
    throw new Error('Offer not found')
  }

  const isManual =
    offerData.source === 'manual' || offerData.created_source === 'manual'

  if (
    input.visibility &&
    input.brandGuidelinesUrl === undefined &&
    input.notes === undefined &&
    input.advertiserId === undefined &&
    input.advertiserName === undefined
  ) {
    return updateOfferVisibility(id, input.visibility)
  }

  return updateOfferDetails(id, input, isManual)
}

export async function syncOffersFromEverflow(apiKey: string): Promise<number> {
  const offers = await fetchEverflowOffers(apiKey)

  if (!offers || offers.length === 0) {
    return 0
  }

  return upsertOffersFromEverflow(offers)
}

export async function bulkUpdateOffers(
  offerIds: string[],
  updates: {
    visibility?: OfferVisibility
    brandGuidelinesUrl?: string | null
    notes?: string | null
  },
): Promise<string[]> {
  return bulkUpdateOffersRepo(offerIds, updates)
}

