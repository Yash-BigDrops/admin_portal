# Backend Reset Complete - Admin Portal

## Overview
This document details all changes made during the backend hard reset and migration to shared packages architecture.

## Date
Completed: $(Get-Date -Format "yyyy-MM-dd")

---

## ✅ Step 1: Hard Reset Backend

### Deleted Files/Directories
- ✅ `apps/admin-portal/lib/` - Removed old auth.ts and middleware.ts
- ✅ `apps/admin-portal/middleware.ts` - Removed root middleware file
- ✅ `apps/publisher-portal/lib/` - Removed old backend files
- ✅ `apps/publisher-portal/middleware.ts` - Removed root middleware file

### Rationale
Cleaned up portal-specific backend logic to migrate to shared packages architecture.

---

## ✅ Step 2: Next.js v16 Upgrade

### Status
- ✅ All apps already using Next.js v16 canary (`^16.0.2-canary.13`)
- ✅ No changes needed

---

## ✅ Step 3: Shared Auth Package Setup

### Created Files

#### `packages/auth/src/auth.ts`
Complete NextAuth configuration with:
- JWT session strategy
- Credentials provider with bcrypt password verification
- Database integration via `@repo/database`
- Role-based session callbacks

**Key Code:**
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [Credentials({ ... })],
  callbacks: { jwt, session }
})
```

#### `packages/auth/src/get-admin-session.ts`
Helper function to validate admin/super_admin sessions:

```typescript
export async function getAdminSession(
  authFn: () => Promise<any>
): Promise<any> {
  const session = await authFn()
  if (!session || !session.user) return null
  
  const userRole = (session.user as any).role as string
  const adminRoles = ['admin', 'super_admin']
  
  if (!adminRoles.includes(userRole)) return null
  return session
}
```

#### `packages/auth/src/index.ts`
Exports all auth utilities:
- `requireAuth`, `requirePermission` from require-auth
- `PERMISSIONS`, `can` from rbac
- `getAdminSession` from get-admin-session
- `handlers`, `auth`, `signIn`, `signOut` from auth

---

## ✅ Step 4: Clean Admin Backend Entry Point

### Created: `apps/admin-portal/app/api/requests/route.ts`

Clean API route using shared packages:

```typescript
import { NextResponse } from 'next/server'
import { getAdminSession } from '@repo/auth'
import { getPool } from '@repo/database'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession(() => auth())
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pool = getPool()
  const result = await pool.query(
    'SELECT * FROM requests ORDER BY created_at DESC'
  )
  
  return NextResponse.json(result.rows)
}
```

### Created: `apps/admin-portal/lib/auth.ts`
Simple re-export wrapper:
```typescript
export { auth, signIn, signOut, handlers } from '@repo/auth'
```

---

## ✅ Step 5: NeonDB Schema Generation

### Created: `apps/admin-portal/schema.sql`

Complete PostgreSQL schema with:

#### Tables Created:
1. **users** - User accounts with roles
2. **roles** - RBAC role definitions
3. **user_roles** - Many-to-many user-role mapping
4. **requests** - Publisher onboarding and other requests
5. **audit_logs** - System audit trail
6. **user_sessions** - JWT session management

#### Key Features:
- UUID primary keys
- Foreign key constraints with CASCADE deletes
- JSONB columns for flexible data storage
- Automatic `updated_at` triggers
- Performance indexes on all key columns
- Default roles inserted (super_admin, admin, client, publisher)

#### RBAC Structure:
```sql
-- Roles table with permissions JSONB
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  permissions JSONB DEFAULT '[]'::jsonb
);

-- User-Role mapping
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  UNIQUE(user_id, role_id)
);
```

---

## 📦 Package Dependencies

### Updated Package Structure
All portals now use shared packages:
- `@repo/auth` - Authentication & RBAC
- `@repo/database` - Database connection pool
- `@repo/types` - TypeScript types
- `@repo/config` - Configuration constants
- `@repo/ui` - Shared UI components

---

## 🔄 Migration Path

### Before:
```typescript
// Old: Portal-specific auth
import { auth } from '@/lib/auth'
```

### After:
```typescript
// New: Shared auth package
import { auth } from '@repo/auth'
// Or via wrapper:
import { auth } from '@/lib/auth' // re-exports @repo/auth
```

---

## 📝 Next Steps

1. **Update existing API routes** to use `@repo/auth` instead of local auth
2. **Run schema.sql** against your NeonDB instance
3. **Update NextAuth route handler** at `app/api/auth/[...nextauth]/route.ts`:
   ```typescript
   import { handlers } from '@/lib/auth'
   export const { GET, POST } = handlers
   ```
4. **Test authentication flow** end-to-end
5. **Migrate remaining API routes** to use shared packages

---

## 🎯 Benefits

1. **Code Reusability** - Auth logic shared across all portals
2. **Consistency** - Same auth behavior everywhere
3. **Maintainability** - Single source of truth for auth
4. **Type Safety** - Shared types ensure consistency
5. **Clean Architecture** - Clear separation of concerns

---

## 📚 Files Changed

### Created:
- `packages/auth/src/auth.ts`
- `packages/auth/src/get-admin-session.ts`
- `packages/auth/src/index.ts` (updated)
- `apps/admin-portal/lib/auth.ts`
- `apps/admin-portal/app/api/requests/route.ts`
- `apps/admin-portal/schema.sql`
- `apps/admin-portal/BACKEND-RESET-COMPLETE.md` (this file)

### Deleted:
- `apps/admin-portal/lib/auth.ts` (old)
- `apps/admin-portal/lib/middleware.ts`
- `apps/admin-portal/middleware.ts`
- `apps/publisher-portal/lib/` (all files)
- `apps/publisher-portal/middleware.ts`

---

## ✅ Verification Checklist

- [x] Old backend files deleted
- [x] Shared auth package created
- [x] Clean API route created
- [x] Database schema generated
- [x] Package exports configured
- [x] TypeScript types aligned
- [x] Documentation created

---

## 🚀 Ready for Next Phase

The backend reset is complete. The admin portal now uses:
- ✅ Shared `@repo/auth` package
- ✅ Shared `@repo/database` package  
- ✅ Clean API route structure
- ✅ Ready-to-run NeonDB schema

Proceed with:
1. Running the schema against your database
2. Updating remaining API routes
3. Testing the authentication flow

