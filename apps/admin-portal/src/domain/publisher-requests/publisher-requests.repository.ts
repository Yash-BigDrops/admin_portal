import { getPool } from '@repo/database'
import type {
  PublisherRequest,
  PublisherRequestStatus,
  ListPublisherRequestsOptions,
  ListPublisherRequestsResult,
  UpdatePublisherRequestStatusInput,
} from './publisher-requests.types'

export async function listPublisherRequests(
  options: ListPublisherRequestsOptions = {},
): Promise<ListPublisherRequestsResult> {
  const {
    status,
    search,
    page = 1,
    pageSize = 20,
  } = options

  const pool = getPool()
  const args: any[] = []
  const where: string[] = []

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where.push(`status = $${args.length + 1}`)
    args.push(status)
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`
    where.push(`(company ILIKE $${args.length + 1} OR email ILIKE $${args.length + 1})`)
    args.push(term)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  const limit = Math.min(100, Math.max(1, pageSize))

  const { rows } = await pool.query(
    `SELECT *, COUNT(*) OVER() AS __total
     FROM publisher_requests
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
    [...args, limit, offset],
  )

  const total = rows[0]?.__total ?? 0
  rows.forEach((r: any) => delete r.__total)

  return {
    data: rows,
    total,
    page,
    pageSize: limit,
  }
}

export async function getPublisherRequestById(
  id: string,
): Promise<PublisherRequest | null> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT
      id,
      offer_id,
      company,
      email,
      creative_type,
      data,
      status,
      admin_notes,
      created_at,
      updated_at
    FROM publisher_requests
    WHERE id = $1
  `,
    [id],
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

export async function updatePublisherRequestStatus(
  id: string,
  input: UpdatePublisherRequestStatusInput,
): Promise<PublisherRequest> {
  const pool = getPool()
  const { rows } = await pool.query(
    `
    UPDATE publisher_requests
    SET status = $1,
        admin_notes = COALESCE($2, admin_notes),
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, offer_id, company, email, creative_type, data, status, admin_notes, created_at, updated_at
  `,
    [input.status, input.admin_notes ?? null, id],
  )

  if (rows.length === 0) {
    throw new Error('Publisher request not found')
  }

  return rows[0]
}

