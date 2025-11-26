const EVERFLOW_API_BASE =
  process.env.EVERFLOW_API_URL ?? 'https://api.eflow.team/v1'

import type { OfferInfo } from './offers.types'

type AdvertiserMap = Record<
  string,
  {
    id: string
    name: string
  }
>

async function fetchAdvertisers(apiKey: string): Promise<AdvertiserMap> {
  try {
    const res = await fetch(`${EVERFLOW_API_BASE}/networks/advertisers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Eflow-API-Key': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      },
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error(
        '[Everflow] advertisers error:',
        res.status,
        res.statusText,
        errorText.substring(0, 500),
      )
      if (res.status === 401) {
        throw new Error(
          `Everflow API authentication failed (401): ${errorText || 'Invalid API key'}`,
        )
      }
      return {}
    }

    const json = await res.json()

    console.log('[Everflow] advertisers response keys:', Object.keys(json))
    if (Object.keys(json).length > 0) {
      console.log(
        '[Everflow] advertisers sample response:',
        JSON.stringify(json).substring(0, 500),
      )
    }

    let arr: any[] = []
    if (Array.isArray(json)) {
      arr = json
    } else if (Array.isArray(json.advertisers)) {
      arr = json.advertisers
    } else if (json.data && Array.isArray(json.data.advertisers)) {
      arr = json.data.advertisers
    } else if (json.data && Array.isArray(json.data)) {
      arr = json.data
    }

    console.log('[Everflow] advertisers count:', arr.length)

    const advertisers: AdvertiserMap = {}
    for (const adv of arr) {
      const rawId =
        adv.network_advertiser_id ?? adv.advertiser_id ?? adv.id
      const name =
        adv.name ?? adv.company ?? adv.advertiser_name ?? null

      if (!rawId || !name) continue

      const id = String(rawId)
      advertisers[id] = { id, name }
    }

    return advertisers
  } catch (err) {
    console.error('[Everflow] advertisers fetch failed:', err)
    return {}
  }
}

export async function fetchEverflowOffers(apiKey: string): Promise<OfferInfo[]> {
  const headers = {
    'Content-Type': 'application/json',
    'X-Eflow-API-Key': apiKey,
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  }

  const pageSize = 1000
  let page = 1
  const byId: Record<string, OfferInfo> = {}

  const advertisersPromise = fetchAdvertisers(apiKey)

  while (true) {
    try {
      const res = await fetch(
        `${EVERFLOW_API_BASE}/networks/offerstable?page=${page}&page_size=${pageSize}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filters: { offer_status: 'active' },
            sort_by: { column: 'created', order: 'desc' },
          }),
        },
      )

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        console.error(
          '[Everflow] offerstable error:',
          res.status,
          res.statusText,
          errorText.substring(0, 500),
        )
        if (page === 1) {
          throw new Error(
            `Everflow API error ${res.status}: ${errorText.substring(0, 200)}`,
          )
        }
        break
      }

      const json = await res.json()

      if (page === 1) {
        console.log('[Everflow] offerstable response keys:', Object.keys(json))
        console.log(
          '[Everflow] offerstable sample response:',
          JSON.stringify(json).substring(0, 500),
        )
      }

      let items: any[] = []
      if (Array.isArray(json)) {
        items = json
      } else if (Array.isArray(json.offers)) {
        items = json.offers
      } else if (Array.isArray(json.entries)) {
        items = json.entries
      } else if (json.data) {
        if (Array.isArray(json.data)) {
          items = json.data
        } else if (Array.isArray(json.data.offers)) {
          items = json.data.offers
        } else if (Array.isArray(json.data.entries)) {
          items = json.data.entries
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        if (page === 1) {
          console.warn(
            '[Everflow] No offers found in response:',
            JSON.stringify(json).substring(0, 500),
          )
        }
        break
      }

      console.log(`[Everflow] Fetched page ${page}: ${items.length} offers`)

      for (const offer of items) {
        const rawId = offer.network_offer_id ?? offer.offer_id ?? offer.id
        const name: string | undefined = offer.name
        const status: string | undefined = offer.status

        if (!rawId || !name || !status) continue

        const id = String(rawId)

        const advertiserIdRaw =
          offer.advertiser_id ??
          offer.advertiserId ??
          offer.network_advertiser_id ??
          null

        const advertiserId = advertiserIdRaw ? String(advertiserIdRaw) : null

        byId[id] = {
          id,
          name,
          status,
          advertiserId,
          advertiserName:
            offer.advertiser_name ?? offer.advertiserName ?? null,
          payout: typeof offer.payout === 'number' ? offer.payout : null,
          currency: offer.currency ?? null,
          geoTargets: offer.geo_targets ?? offer.geoTargets ?? null,
          raw: offer,
        }
      }

      if (items.length < pageSize) break
      page++
    } catch (error) {
      console.error('[Everflow] fetchAllOffers error on page', page, ':', error)
      if (page === 1) {
        throw error
      }
      break
    }
  }

  const advertisers = await advertisersPromise

  for (const offer of Object.values(byId)) {
    if (offer.advertiserId && !offer.advertiserName) {
      const adv =
        advertisers[offer.advertiserId] ||
        advertisers[String(Number(offer.advertiserId))]
      if (adv) {
        offer.advertiserName = adv.name
      }
    }
  }

  console.log(
    '[Everflow] offers + advertisers:',
    Object.values(byId).slice(0, 5).map((o) => ({
      id: o.id,
      advertiserId: o.advertiserId,
      advertiserName: o.advertiserName,
    })),
  )

  return Object.values(byId)
}

