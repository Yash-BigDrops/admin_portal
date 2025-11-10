import * as Sentry from '@sentry/nextjs'

type AuditEvent = {
  actorId?: string
  actorEmail?: string
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

export function auditLog(event: AuditEvent) {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
    source: 'admin-portal',
  }

  console.log('[AUDIT]', JSON.stringify(payload))

  Sentry.addBreadcrumb({
    category: 'audit',
    level: 'info',
    data: payload,
  })
}

