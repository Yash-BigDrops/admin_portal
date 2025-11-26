import { getPool } from '@repo/database'
import { decrypt } from './encryption'

export type Credential = {
  id: string
  platform: string
  account_name: string
  api_key: string
  secret?: string | null
  data?: any
}

export async function getCredential(
  platform: string,
  accountName?: string,
): Promise<Credential | null> {
  const pool = getPool()

  let query = `
    SELECT 
      id,
      platform,
      account_name,
      encrypted_api_key,
      encrypted_secret,
      encrypted_data
    FROM integration_credentials
    WHERE platform = $1
  `
  const params: any[] = [platform]

  if (accountName) {
    query += ` AND account_name = $2`
    params.push(accountName)
  } else {
    query += ` ORDER BY created_at DESC LIMIT 1`
  }

  const { rows } = await pool.query(query, params)

  if (rows.length === 0) {
    return null
  }

  const cred = rows[0]

  return {
    id: cred.id,
    platform: cred.platform,
    account_name: cred.account_name,
    api_key: decrypt(cred.encrypted_api_key),
    secret: cred.encrypted_secret ? decrypt(cred.encrypted_secret) : null,
    data: cred.encrypted_data?.encrypted
      ? JSON.parse(decrypt(cred.encrypted_data.encrypted))
      : null,
  }
}

export async function getAllCredentials(
  platform?: string,
): Promise<Credential[]> {
  const pool = getPool()

  let query = `
    SELECT 
      id,
      platform,
      account_name,
      encrypted_api_key,
      encrypted_secret,
      encrypted_data
    FROM integration_credentials
  `
  const params: any[] = []

  if (platform) {
    query += ` WHERE platform = $1`
    params.push(platform)
  }

  query += ` ORDER BY platform, account_name`

  const { rows } = await pool.query(query, params)

  return rows.map((cred) => ({
    id: cred.id,
    platform: cred.platform,
    account_name: cred.account_name,
    api_key: decrypt(cred.encrypted_api_key),
    secret: cred.encrypted_secret ? decrypt(cred.encrypted_secret) : null,
    data: cred.encrypted_data?.encrypted
      ? JSON.parse(decrypt(cred.encrypted_data.encrypted))
      : null,
  }))
}

