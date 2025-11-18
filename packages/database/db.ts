import { Pool } from 'pg'
import { getMainPool } from './pools'

// Backward compatibility: getPool() now uses main DB
// For new code, prefer getMainPool() or getPublisherPool() explicitly
export function getPool(): Pool {
  return getMainPool()
}

