import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY not configured. Generate with: openssl rand -base64 32',
    )
  }
  return Buffer.from(key, 'base64')
}

export function encrypt(value: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return `${iv.toString('base64')}.${encrypted.toString('base64')}.${tag.toString('base64')}`
}

export function decrypt(payload: string): string {
  const key = getKey()
  const parts = payload.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format')
  }

  const [ivStr, encryptedStr, tagStr] = parts
  const iv = Buffer.from(ivStr, 'base64')
  const encrypted = Buffer.from(encryptedStr, 'base64')
  const tag = Buffer.from(tagStr, 'base64')

  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

