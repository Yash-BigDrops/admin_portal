export * from './db'
export * from './pools'
import { getMainPool } from './pools'

export async function writeAudit(
  actor_email: string,
  action: string,
  entity: string,
  entity_id: string,
  metadata: any = {}
) {
  const pool = getMainPool()
  await pool.query(
    `INSERT INTO audit_logs (actor_email, action, entity, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [actor_email, action, entity, entity_id, JSON.stringify(metadata)]
  )
}

