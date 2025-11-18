# Logging and Retention Policy

## Audit Logs

**Retention Period**: 1 year

**Purpose**: Audit logs track all administrative actions for compliance and security monitoring.

**Contents**:
- Actor email (admin who performed the action)
- Action type (e.g., `update_status`)
- Entity type and ID
- Metadata (JSONB field with action-specific details)
- Timestamp

**Access**: Admin-only via `/audit-logs` page

**Storage**: PostgreSQL `audit_logs` table

## Application Logs

**Retention Period**: 90 days

**Purpose**: Application logs track errors, warnings, and informational messages for debugging and monitoring.

**Contents**:
- Error messages
- API request/response logs
- Database connection issues
- Rate limiting events

**Access**: Server-side only (not exposed to users)

**Storage**: Server logs (configured per deployment environment)

## Compliance

This logging policy supports:
- **SOC2**: Audit trail requirements
- **ISO 27001**: Security event logging
- **GDPR**: User action tracking (with proper data handling)

## Data Privacy

- Audit logs contain admin email addresses (actors)
- No sensitive user data is logged in metadata
- Logs are encrypted at rest (via database encryption)
- Access is restricted to authenticated admin users only

## Retention Enforcement

- Automated cleanup scripts should run monthly to remove logs older than retention periods
- Consider archiving old logs before deletion for long-term compliance needs

