import { describe, it, expect, vi, afterEach } from 'vitest'
import * as AuthModule from '@/lib/auth'
import { PERMISSIONS } from '@/lib/rbac'
import { requireAuth, requirePermission } from '@/lib/auth/require-auth'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

const mockedAuth = AuthModule as unknown as { auth: () => Promise<any> }

describe('requireAuth / requirePermission', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when no session', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue(null)

    const result = await requireAuth()

    expect(result.session).toBeNull()
    expect(result.error).toEqual({
      status: 401,
      message: 'Unauthorized',
    })
  })

  it('returns error when session has no user', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({})

    const result = await requireAuth()

    expect(result.session).toBeNull()
    expect(result.error).toEqual({
      status: 401,
      message: 'Unauthorized',
    })
  })

  it('returns session when user is present', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', role: 'admin' },
    })

    const result = await requireAuth()

    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
    expect(result.session?.user.id).toBe('user-1')
  })

  it('denies permission when user lacks permission', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({
      user: {
        id: 'user-2',
        email: 'user@example.com',
        role: 'user',
      },
    })

    const result = await requirePermission('MANAGE_OFFERS')

    expect(result.session).toBeNull()
    expect(result.error).toEqual({
      status: 403,
      message: 'Forbidden',
    })
  })

  it('allows when user has permission via role', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({
      user: {
        id: 'user-3',
        email: 'admin@example.com',
        role: 'admin',
      },
    })

    const result = await requirePermission('MANAGE_OFFERS')

    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
    expect(result.session?.user.email).toBe('admin@example.com')
  })

  it('allows super_admin for any permission', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({
      user: {
        id: 'user-4',
        email: 'super@example.com',
        role: 'super_admin',
      },
    })

    const result = await requirePermission('MANAGE_USERS')

    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
  })

  it('allows manager for MANAGE_OFFERS', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({
      user: {
        id: 'user-5',
        email: 'manager@example.com',
        role: 'manager',
      },
    })

    const result = await requirePermission('MANAGE_OFFERS')

    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
  })

  it('denies manager for MANAGE_USERS', async () => {
    mockedAuth.auth = vi.fn().mockResolvedValue({
      user: {
        id: 'user-6',
        email: 'manager@example.com',
        role: 'manager',
      },
    })

    const result = await requirePermission('MANAGE_USERS')

    expect(result.session).toBeNull()
    expect(result.error?.status).toBe(403)
  })
})

