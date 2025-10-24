import type { Adapter } from "@auth/core/adapters"
import { getPool } from "@/lib/database/db"

export function CustomPostgresAdapter(): Adapter {
  const pool = getPool()

  return {
    async createUser(user) {
      const result = await pool.query(`
        INSERT INTO users (email, name, email_verified, image, role, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, email_verified, image, role
      `, [
        user.email,
        user.name,
        user.emailVerified,
        user.image,
        'user', // default role
        null // no password for OAuth users
      ])
      
      const userData = result.rows[0]
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        emailVerified: userData.email_verified,
        image: userData.image,
      }
    },

    async getUser(id) {
      const result = await pool.query(`
        SELECT id, email, name, email_verified, image, role
        FROM users
        WHERE id = $1
      `, [id])
      
      if (result.rows.length === 0) return null
      
      const user = result.rows[0]
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        image: user.image,
      }
    },

    async getUserByEmail(email) {
      const result = await pool.query(`
        SELECT id, email, name, email_verified, image, role
        FROM users
        WHERE email = $1
      `, [email])
      
      if (result.rows.length === 0) return null
      
      const user = result.rows[0]
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        image: user.image,
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const result = await pool.query(`
        SELECT u.id, u.email, u.name, u.email_verified, u.image, u.role
        FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider = $1 AND a.provider_account_id = $2
      `, [provider, providerAccountId])
      
      if (result.rows.length === 0) return null
      
      const user = result.rows[0]
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
        image: user.image,
      }
    },

    async updateUser(user) {
      const result = await pool.query(`
        UPDATE users
        SET email = $2, name = $3, email_verified = $4, image = $5
        WHERE id = $1
        RETURNING id, email, name, email_verified, image, role
      `, [user.id, user.email, user.name, user.emailVerified, user.image])
      
      const userData = result.rows[0]
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        emailVerified: userData.email_verified,
        image: userData.image,
      }
    },

    async deleteUser(userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    },

    async linkAccount(account) {
      const result = await pool.query(`
        INSERT INTO accounts (
          user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at,
          token_type, scope, id_token, session_state
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, user_id, type, provider, provider_account_id
      `, [
        account.userId,
        account.type,
        account.provider,
        account.providerAccountId,
        account.refresh_token,
        account.access_token,
        account.expires_at,
        account.token_type,
        account.scope,
        account.id_token,
        account.session_state
      ])
      
      return {
        ...account,
        id: result.rows[0].id,
      }
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await pool.query(`
        DELETE FROM accounts
        WHERE provider = $1 AND provider_account_id = $2
      `, [provider, providerAccountId])
    },

    async createSession({ sessionToken, userId, expires }) {
      const result = await pool.query(`
        INSERT INTO sessions (session_token, user_id, expires)
        VALUES ($1, $2, $3)
        RETURNING id, session_token, user_id, expires
      `, [sessionToken, userId, expires])
      
      const session = result.rows[0]
      return {
        sessionToken: session.session_token,
        userId: session.user_id,
        expires: session.expires,
      }
    },

    async getSessionAndUser(sessionToken) {
      const result = await pool.query(`
        SELECT s.id, s.session_token, s.user_id, s.expires,
               u.id as user_id, u.email, u.name, u.email_verified, u.image, u.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = $1
      `, [sessionToken])
      
      if (result.rows.length === 0) return null
      
      const row = result.rows[0]
      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: row.expires,
        },
        user: {
          id: row.user_id,
          email: row.email,
          name: row.name,
          emailVerified: row.email_verified,
          image: row.image,
        }
      }
    },

    async updateSession(session) {
      const result = await pool.query(`
        UPDATE sessions
        SET expires = $2
        WHERE session_token = $1
        RETURNING id, session_token, user_id, expires
      `, [session.sessionToken, session.expires])
      
      if (result.rows.length === 0) return null
      
      const updatedSession = result.rows[0]
      return {
        sessionToken: updatedSession.session_token,
        userId: updatedSession.user_id,
        expires: updatedSession.expires,
      }
    },

    async deleteSession(sessionToken) {
      await pool.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken])
    },

    async createVerificationToken({ identifier, expires, token }) {
      const result = await pool.query(`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES ($1, $2, $3)
        RETURNING identifier, token, expires
      `, [identifier, token, expires])
      
      return result.rows[0]
    },

    async useVerificationToken({ identifier, token }) {
      const result = await pool.query(`
        DELETE FROM verification_tokens
        WHERE identifier = $1 AND token = $2
        RETURNING identifier, token, expires
      `, [identifier, token])
      
      if (result.rows.length === 0) return null
      
      return result.rows[0]
    },
  }
}
