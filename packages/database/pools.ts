import { Pool } from 'pg'

let mainPool: Pool | null = null
let publisherPool: Pool | null = null

export function getMainPool(): Pool {
  if (!mainPool) {
    const coreDbUrl = process.env.CORE_DATABASE_URL || process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL;
    if (!coreDbUrl) {
      throw new Error('CORE_DATABASE_URL or DATABASE_URL environment variable is required');
    }
    mainPool = new Pool({
      connectionString: coreDbUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }
  return mainPool
}

export function getPublisherPool(): Pool {
  if (!publisherPool) {
    const publisherDbUrl = process.env.PUBLISHER_DATABASE_URL || process.env.DATABASE_URL_PUBLISHER;
    if (!publisherDbUrl) {
      throw new Error('PUBLISHER_DATABASE_URL environment variable is required')
    }
    publisherPool = new Pool({
      connectionString: publisherDbUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }
  return publisherPool
}

