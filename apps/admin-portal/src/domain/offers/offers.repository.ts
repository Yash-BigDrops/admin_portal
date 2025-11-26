import { getPool } from '@repo/database'
import type {
  Offer,
  OfferVisibility,
  ListOffersOptions,
  CreateManualOfferInput,
  UpdateOfferDetailsInput,
} from './offers.types'

export async function listOffers(
  options: ListOffersOptions = {},
): Promise<Offer[]> {
  const {
    sort = 'id_desc',
    limit = 1000,
    offset = 0,
    status = 'active',
    visibility,
  } = options

  const pool = getPool()
  const params: any[] = []
  const whereParts: string[] = []
  let idx = 1

  if (status) {
    whereParts.push(`status = $${idx++}`)
    params.push(status)
  }

  if (visibility) {
    whereParts.push(`visibility = $${idx++}`)
    params.push(visibility)
  }

  const whereClause =
    whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

  let orderBy = 'everflow_offer_id::int DESC'
  switch (sort) {
    case 'id_asc':
      orderBy = 'everflow_offer_id::int ASC'
      break
    case 'name_asc':
      orderBy = 'name ASC'
      break
    case 'name_desc':
      orderBy = 'name DESC'
      break
    case 'id_desc':
    default:
      orderBy = 'everflow_offer_id::int DESC'
  }

  params.push(limit, offset)

  const result = await pool.query(
    `
    SELECT
      id,
      everflow_offer_id,
      name,
      status,
      visibility,
      advertiser_id,
      advertiser_name,
      geo_targets,
      data,
      created_at,
      updated_at
    FROM offers
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `,
    params,
  )

  return result.rows
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT
      id,
      everflow_offer_id,
      name,
      status,
      visibility,
      advertiser_id,
      advertiser_name,
      geo_targets,
      data,
      created_at,
      updated_at
    FROM offers
    WHERE id = $1
  `,
    [id],
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

export async function createManualOffer(
  input: CreateManualOfferInput,
): Promise<Offer> {
  const pool = getPool()

  const data: Record<string, any> = { source: 'manual' }
  if (input.brandGuidelinesUrl) {
    data.brand_guidelines_url = input.brandGuidelinesUrl
  }
  if (input.notes) {
    data.notes = input.notes
  }

  const result = await pool.query(
    `
    INSERT INTO offers (
      everflow_offer_id,
      name,
      status,
      visibility,
      advertiser_id,
      advertiser_name,
      data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (everflow_offer_id) DO NOTHING
    RETURNING id,
              everflow_offer_id,
              name,
              status,
              visibility,
              advertiser_id,
              advertiser_name,
              geo_targets,
              data,
              created_at,
              updated_at
  `,
    [
      input.offerId.trim(),
      input.name.trim(),
      input.status || 'active',
      input.visibility || 'hidden',
      input.advertiserId || null,
      input.advertiserName || null,
      JSON.stringify(data),
    ],
  )

  if (result.rows.length === 0) {
    throw new Error('An offer with that ID already exists.')
  }

  return result.rows[0]
}

export async function updateOfferVisibility(
  id: string,
  visibility: OfferVisibility,
): Promise<Offer> {
  const pool = getPool()
  const result = await pool.query(
    `
    UPDATE offers
    SET visibility = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, everflow_offer_id, name, status, visibility, advertiser_id, advertiser_name, geo_targets, data, created_at, updated_at
  `,
    [visibility, id],
  )

  if (result.rows.length === 0) {
    throw new Error('Offer not found')
  }

  return result.rows[0]
}

export async function updateOfferDetails(
  id: string,
  input: UpdateOfferDetailsInput,
  isManual: boolean,
): Promise<Offer> {
  const pool = getPool()

  const dataPatch: Record<string, any> = {}
  if (input.brandGuidelinesUrl !== undefined) {
    dataPatch.brand_guidelines_url = input.brandGuidelinesUrl
  }
  if (input.notes !== undefined) {
    dataPatch.notes = input.notes
  }

  const updateAdvertiserFields =
    isManual &&
    (input.advertiserId !== undefined || input.advertiserName !== undefined)

  let sqlQuery = `
    UPDATE offers
    SET
      visibility = COALESCE($1, visibility),
  `
  const queryParams: any[] = [input.visibility ?? null]
  let paramIndex = 2

  if (updateAdvertiserFields) {
    sqlQuery += `advertiser_id = COALESCE($${paramIndex}, advertiser_id),
      advertiser_name = COALESCE($${paramIndex + 1}, advertiser_name),
    `
    queryParams.push(input.advertiserId ?? null, input.advertiserName ?? null)
    paramIndex += 2
  }

  sqlQuery += `data = COALESCE(data, '{}'::jsonb) || $${paramIndex}::jsonb,
      updated_at = NOW()
    WHERE id = $${paramIndex + 1}
    RETURNING *
  `
  queryParams.push(JSON.stringify(dataPatch), id)

  const result = await pool.query(sqlQuery, queryParams)

  if (result.rows.length === 0) {
    throw new Error('Offer not found')
  }

  return result.rows[0]
}

export async function upsertOffersFromEverflow(
  offers: Array<{
    id: string
    name: string
    status: string
    advertiserId: string | null
    advertiserName: string | null
    payout: number | null
    currency: string | null
    geoTargets: string[] | null
    raw: any
  }>,
): Promise<number> {
  const pool = getPool()
  let count = 0

  for (const offer of offers) {
    try {
      let dataJson: any
      if (typeof offer.raw === 'string') {
        try {
          JSON.parse(offer.raw)
          dataJson = offer.raw
        } catch {
          dataJson = JSON.stringify({ raw: offer.raw })
        }
      } else {
        dataJson = offer.raw || {}
      }

      await pool.query(
        `
        INSERT INTO offers (
          everflow_offer_id,
          name,
          status,
          visibility,
          payout,
          currency,
          geo_targets,
          data,
          advertiser_id,
          advertiser_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
        ON CONFLICT (everflow_offer_id) DO UPDATE SET
          name            = EXCLUDED.name,
          status          = EXCLUDED.status,
          visibility      = EXCLUDED.visibility,
          payout          = EXCLUDED.payout,
          currency        = EXCLUDED.currency,
          geo_targets     = EXCLUDED.geo_targets,
          data            = EXCLUDED.data,
          advertiser_id   = EXCLUDED.advertiser_id,
          advertiser_name = EXCLUDED.advertiser_name,
          updated_at      = NOW();
      `,
        [
          offer.id,
          offer.name,
          offer.status,
          'hidden',
          offer.payout,
          offer.currency,
          offer.geoTargets,
          typeof dataJson === 'string' ? dataJson : JSON.stringify(dataJson),
          offer.advertiserId,
          offer.advertiserName,
        ],
      )
      count++
    } catch (error: any) {
      if (error?.message?.includes('advertiser_id') || error?.message?.includes('advertiser_name')) {
        console.warn('[offers.repository] advertiser columns missing, trying without them:', error.message)
        try {
          let dataJson: any
          if (typeof offer.raw === 'string') {
            try {
              JSON.parse(offer.raw)
              dataJson = offer.raw
            } catch {
              dataJson = JSON.stringify({ raw: offer.raw })
            }
          } else {
            dataJson = offer.raw || {}
          }
          
          await pool.query(
            `
            INSERT INTO offers (
              everflow_offer_id,
              name,
              status,
              visibility,
              payout,
              currency,
              geo_targets,
              data
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
            ON CONFLICT (everflow_offer_id) DO UPDATE SET
              name            = EXCLUDED.name,
              status          = EXCLUDED.status,
              visibility      = EXCLUDED.visibility,
              payout          = EXCLUDED.payout,
              currency        = EXCLUDED.currency,
              geo_targets     = EXCLUDED.geo_targets,
              data            = EXCLUDED.data,
              updated_at      = NOW();
          `,
            [
              offer.id,
              offer.name,
              offer.status,
              'hidden',
              offer.payout,
              offer.currency,
              offer.geoTargets,
              typeof dataJson === 'string' ? dataJson : JSON.stringify(dataJson),
            ],
          )
          count++
        } catch (fallbackError: any) {
          console.error('[offers.repository] Failed to insert offer:', offer.id, fallbackError.message)
          throw fallbackError
        }
      } else {
        console.error('[offers.repository] Failed to insert offer:', offer.id, error.message)
        throw error
      }
    }
  }

  return count
}

export async function getOfferData(id: string): Promise<any | null> {
  const pool = getPool()
  const result = await pool.query(`SELECT data FROM offers WHERE id = $1`, [id])

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0].data || {}
}

export async function bulkUpdateOffers(
  offerIds: string[],
  updates: {
    visibility?: OfferVisibility
    brandGuidelinesUrl?: string | null
    notes?: string | null
  },
): Promise<string[]> {
  const pool = getPool()
  const updatedIds: string[] = []

  const dataPatch: Record<string, any> = {}
  if (updates.brandGuidelinesUrl !== undefined) {
    dataPatch.brand_guidelines_url = updates.brandGuidelinesUrl
  }
  if (updates.notes !== undefined) {
    dataPatch.notes = updates.notes
  }

  for (const id of offerIds) {
    try {
      const setParts: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (updates.visibility !== undefined) {
        setParts.push(`visibility = $${paramIndex++}`)
        params.push(updates.visibility)
      }

      if (Object.keys(dataPatch).length > 0) {
        setParts.push(`data = COALESCE(data, '{}'::jsonb) || $${paramIndex++}::jsonb`)
        params.push(JSON.stringify(dataPatch))
      }

      if (setParts.length === 0) {
        continue
      }

      setParts.push(`updated_at = NOW()`)
      params.push(id)

      const result = await pool.query(
        `
        UPDATE offers
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id
      `,
        params,
      )

      if (result.rows.length > 0) {
        updatedIds.push(id)
      }
    } catch (error) {
      console.error(`[offers.repository] Failed to update offer ${id}:`, error)
    }
  }

  return updatedIds
}

