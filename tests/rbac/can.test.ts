import { describe, it, expect } from 'vitest'
import { PERMISSIONS, can } from '@/lib/rbac'

describe('RBAC - can()', () => {
  it('super_admin has all permissions', () => {
    expect(can('super_admin', PERMISSIONS.MANAGE_OFFERS)).toBe(true)
    expect(can('super_admin', PERMISSIONS.MANAGE_USERS)).toBe(true)
    expect(can('super_admin', PERMISSIONS.VIEW_ANALYTICS)).toBe(true)
    expect(can('super_admin', PERMISSIONS.MANAGE_PUBLISHERS)).toBe(true)
    expect(can('super_admin', PERMISSIONS.MANAGE_SETTINGS)).toBe(true)
  })

  it('admin has all permissions', () => {
    expect(can('admin', PERMISSIONS.MANAGE_OFFERS)).toBe(true)
    expect(can('admin', PERMISSIONS.MANAGE_USERS)).toBe(true)
    expect(can('admin', PERMISSIONS.VIEW_ANALYTICS)).toBe(true)
  })

  it('manager has limited permissions', () => {
    expect(can('manager', PERMISSIONS.VIEW_ANALYTICS)).toBe(true)
    expect(can('manager', PERMISSIONS.MANAGE_PUBLISHERS)).toBe(true)
    expect(can('manager', PERMISSIONS.MANAGE_OFFERS)).toBe(true)
    expect(can('manager', PERMISSIONS.MANAGE_USERS)).toBe(false)
    expect(can('manager', PERMISSIONS.MANAGE_SETTINGS)).toBe(false)
  })

  it('editor has limited permissions', () => {
    expect(can('editor', PERMISSIONS.MANAGE_OFFERS)).toBe(true)
    expect(can('editor', PERMISSIONS.VIEW_ANALYTICS)).toBe(true)
    expect(can('editor', PERMISSIONS.MANAGE_PUBLISHERS)).toBe(false)
    expect(can('editor', PERMISSIONS.MANAGE_USERS)).toBe(false)
  })

  it('user has minimal permissions', () => {
    expect(can('user', PERMISSIONS.VIEW_ANALYTICS)).toBe(true)
    expect(can('user', PERMISSIONS.MANAGE_OFFERS)).toBe(false)
    expect(can('user', PERMISSIONS.MANAGE_USERS)).toBe(false)
  })

  it('returns false for unknown roles', () => {
    expect(can('unknown_role', PERMISSIONS.VIEW_ANALYTICS)).toBe(false)
  })

  it('returns false for unknown permissions', () => {
    expect(can('admin', 'unknown_permission' as any)).toBe(false)
  })
})

