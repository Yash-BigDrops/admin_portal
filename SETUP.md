# Bigdrops Monorepo Setup

## Stage 0: Monorepo Setup - Completed

### Step 1: Turborepo Workspace Structure
Created the base monorepo structure with:
- Root `package.json` configured for Turborepo
- `pnpm-workspace.yaml` for workspace package management
- `turbo.json` with pipeline configuration

### Step 2: Folder Structure Created

#### Apps Directory
- `apps/admin-portal/` - Admin portal application
- `apps/publisher-portal/` - Publisher portal application
- `apps/advertiser-portal/` - Advertiser portal application

#### Packages Directory
- `packages/auth/` - Authentication package
- `packages/database/` - Database package
- `packages/types/` - Shared TypeScript types
- `packages/config/` - Shared configuration
- `packages/ui/` - Shared UI components

### Step 3: Configuration Files

#### `pnpm-workspace.yaml`
```yaml
packages:
  - apps/*
  - packages/*
```

#### `turbo.json`
Configured with:
- `dev` pipeline: persistent mode, no cache
- `build` pipeline: depends on dependencies, outputs Next.js and dist builds
- `lint` and `test` pipelines: ready for configuration

#### Root `package.json`
- Turborepo scripts: dev, build, lint, test
- Package manager: pnpm
- Node engine requirement: >=18

## Stage 1: Admin Portal Scaffolding - Completed

### Next.js 16 Setup
Created Admin Portal application with:
- **Next.js 16** (canary version 16.0.2-canary.14)
- **TypeScript** enabled
- **App Router** with `/src` directory structure
- **Tailwind CSS v4** configured
- **ESLint** with Next.js config
- **Import alias** `@/*` configured for monorepo compatibility

### Project Structure
```
apps/admin-portal/
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── globals.css
│       └── favicon.ico
├── public/
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── package.json
```

### Dependencies Installed
- next: 16.0.2-canary.14
- react: 19.2.0
- react-dom: 19.2.0
- tailwindcss: ^4
- typescript: ^5
- eslint: ^9

## Stage 2: Shared Packages Setup - Completed

### Stage 2.1: @repo/database Package

Created PostgreSQL database package with:
- **`db.ts`** - PostgreSQL Pool connection manager with NeonDB support
- **`schema.sql`** - Database schema for `publisher_requests` table
- **`index.ts`** - Package exports
- **`package.json`** - Package configuration with `pg` dependency

#### Database Schema
```sql
CREATE TABLE IF NOT EXISTS publisher_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  creative_type TEXT,
  data JSONB,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stage 2.2: @repo/auth Package

Created authentication package with:
- **`get-admin-session.ts`** - Admin session helper using NextAuth
- **`options.ts`** - NextAuth configuration with role-based access
- **`index.ts`** - Package exports
- **`package.json`** - Package configuration with `next-auth` dependency

### Stage 2.3: @repo/types Package

Created shared TypeScript types package:
- **`index.ts`** - TypeScript interfaces for `PublisherRequest` and `User`
- **`package.json`** - Package configuration

#### Types Defined
- `PublisherRequest` - Interface for publisher request data
- `User` - Interface for user data with role-based access

### Package Structure
```
packages/
├── database/
│   ├── db.ts
│   ├── schema.sql
│   ├── index.ts
│   └── package.json
├── auth/
│   ├── get-admin-session.ts
│   ├── options.ts
│   ├── index.ts
│   └── package.json
└── types/
    ├── index.ts
    └── package.json
```

## Stage 3: Dashboard API Setup - Completed

### API Route Created
Created `/api/publisher-requests` route handler:
- **Location**: `apps/admin-portal/src/app/api/publisher-requests/route.ts`
- **Functionality**: GET endpoint that returns all publisher requests ordered by creation date
- **Authentication**: Protected with `getAdminSession()` - returns 401 if unauthorized
- **Database**: Uses `@repo/database` package to query PostgreSQL

#### Route Implementation
```typescript
export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(`
    SELECT * FROM publisher_requests ORDER BY created_at DESC
  `)

  return NextResponse.json({ data: rows })
}
```

### Configuration Updates
- **`package.json`**: Added workspace dependencies (`@repo/auth`, `@repo/database`, `@repo/types`)
- **`tsconfig.json`**: Added path mappings for monorepo packages

### Testing
The route can be tested at:
```
http://localhost:3000/api/publisher-requests
```
(Returns 401 if no admin session is detected - expected until auth is fully configured)

## Stage 4: Admin Dashboard UI - Completed

### Dashboard Page Created
- **Location**: `apps/admin-portal/src/app/dashboard/page.tsx`
- **Functionality**: Server component that checks admin session and renders the dashboard
- **Authentication**: Uses `getAdminSession()` to protect the route
- **Layout**: Simple layout with heading and RequestsTable component

#### Dashboard Page Implementation
```typescript
export default async function DashboardPage() {
  const session = await getAdminSession()
  if (!session) return <div className="p-8">Unauthorized</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Publisher Requests</h1>
      <RequestsTable />
    </div>
  )
}
```

### RequestsTable Component Created
- **Location**: `apps/admin-portal/src/components/RequestsTable.tsx`
- **Type**: Client component (`'use client'`)
- **Functionality**: Fetches and displays publisher requests in a table format
- **Features**:
  - Fetches data from `/api/publisher-requests` on mount
  - Displays Company, Email, Offer ID, and Status columns
  - Hover effects for better UX
  - Responsive table layout

#### RequestsTable Implementation
```typescript
'use client'

export default function RequestsTable() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/publisher-requests')
      const json = await res.json()
      setRequests(json.data)
    }
    load()
  }, [])

  return (
    <table className="w-full text-sm border">
      {/* Table headers and rows */}
    </table>
  )
}
```

### UI Structure
```
apps/admin-portal/src/
├── app/
│   └── dashboard/
│       └── page.tsx (Dashboard Page)
└── components/
    └── RequestsTable.tsx (Table Component)
```

## Stage 5: Approval Panel UI - Completed

### RequestDetailPanel Component Created
- **Location**: `apps/admin-portal/src/components/RequestDetailPanel.tsx`
- **Type**: Client component with side drawer UI
- **Features**:
  - Right-side sliding panel
  - Displays full request details (company, email, offer ID, status, creative type, data, admin notes, timestamps)
  - Approve and Reject buttons (disabled when status already matches)
  - Click-outside overlay to close
  - Color-coded status badges
  - Email mailto links
  - JSON data formatting

### RequestsTable Enhanced
- **Location**: `apps/admin-portal/src/components/RequestsTable.tsx`
- **Enhancements**:
  - Added TypeScript types using `PublisherRequest` from `@repo/types`
  - Row click handler to open detail panel
  - Status badges in table rows
  - Integrated `RequestDetailPanel` component
  - Placeholder handlers for approve/reject (ready for Stage 6)

### UI Features
- Interactive table with clickable rows
- Side drawer with slide-in animation
- Status badges (green=approved, red=rejected, yellow=pending)
- Responsive design
- Accessible button states

## Stage 6: Approve/Reject Backend + UI Wiring - Completed

### API Route Created
- **Location**: `apps/admin-portal/src/app/api/publisher-requests/[id]/route.ts`
- **Method**: PATCH
- **Functionality**: Updates request status (approved/rejected) and admin notes
- **Features**:
  - Validates status is 'approved' or 'rejected'
  - Updates database with new status and optional admin notes
  - Updates `updated_at` timestamp automatically
  - Returns updated request data
  - Error handling with proper HTTP status codes

### RequestDetailPanel Enhanced
- **Changes**:
  - Added async handlers for approve/reject
  - Added loading states ("Processing..." text)
  - Added admin notes textarea input
  - Disabled buttons during submission
  - Error handling with try/catch
  - Clears notes after successful action

### RequestsTable Enhanced
- **Changes**:
  - Implemented optimistic UI updates
  - Added `patchStatus` function for API calls
  - Added rollback on API failure
  - Updates both table and panel state
  - Added empty state message

### Key Features
- **Optimistic Updates**: UI updates immediately, then makes API call
- **Error Handling**: Rolls back to original state on failure
- **Admin Notes**: Optional notes field for decision tracking
- **Loading States**: Visual feedback during API calls
- **Type Safety**: Full TypeScript support

## Stage 6: QA Improvements - Completed

### Authentication Re-enabled
- **GET `/api/publisher-requests`**: Auth protection restored
- **PATCH `/api/publisher-requests/[id]`**: Auth protection restored
- **Dashboard page**: Auth protection restored

### Input Validation Added
- **Zod Schema**: Validates status (approved/rejected) and admin_notes (max 2000 chars)
- **UUID Validation**: Validates UUID format before database queries
- **Error Responses**: Detailed validation error messages

### Database Optimizations
- **pgcrypto Extension**: Enabled for UUID generation
- **Indexes Added**:
  - `idx_publisher_requests_status` - For filtering by status
  - `idx_publisher_requests_created_at` - For sorting by date

### UI Enhancements
- **Error Display**: Red alert box shows error messages
- **Character Counter**: Shows X/2000 for admin notes
- **Refetch After Success**: Ensures UI consistency with database
- **Better UX**: Errors clear when user interacts with form

### Security Improvements
- All routes protected with authentication
- Input validation prevents invalid payloads
- UUID validation prevents SQL injection attempts
- Parameterized queries for safe database operations

## Stage 6: Hardening Tweaks - Completed

### Next.js Config Updated
- **Turbopack root**: Set to `../../` to silence workspace warnings
- **Server external packages**: Added `pg` to prevent resolution issues

### Rate Limiting Added
- **Location**: `apps/admin-portal/src/app/api/_lib/rate-limit.ts`
- **Functionality**: Per-IP rate limiting (5 requests per 10 seconds)
- **Implementation**: In-memory Map-based limiter
- **Applied to**: PATCH `/api/publisher-requests/[id]` route
- **Response**: Returns 429 "Too many requests" when limit exceeded

### Audit Logging Implemented
- **Schema**: `packages/database/audit-schema.sql`
  - `audit_logs` table with actor_email, action, entity, entity_id, metadata
  - Index on `created_at` for performance
- **Function**: `writeAudit()` in `@repo/database` package
- **Integration**: Called after successful status updates
- **Tracks**: Admin email, action type, entity, entity ID, and metadata

### Files Created/Modified
- `apps/admin-portal/next.config.ts` - Added turbopack root and serverExternalPackages
- `apps/admin-portal/src/app/api/_lib/rate-limit.ts` - Rate limiting utility
- `packages/database/index.ts` - Added `writeAudit()` function
- `packages/database/audit-schema.sql` - Audit logs table schema
- `apps/admin-portal/src/app/api/publisher-requests/[id]/route.ts` - Added rate limiting and audit logging

## Stage 7: Filters, Toasts, and Audit Log UI - Completed

### Status Filtering Added
- **API Enhancement**: Added `?status=` query parameter to GET `/api/publisher-requests`
- **Filter Options**: All, Pending, Approved, Rejected
- **Database Query**: Efficient filtering with parameterized queries

### Status Badge Component
- **File**: `apps/admin-portal/src/components/StatusBadge.tsx`
- **Features**: Color-coded badges (green/red/yellow)
- **Reusable**: Used throughout the application

### Toast Notifications
- **File**: `apps/admin-portal/src/components/Toast.tsx`
- **Features**: Success/error variants, auto-dismiss (2.5s)
- **Integration**: Shows on approve/reject actions

### Enhanced RequestsTable
- **Filter Tabs**: All, Pending, Approved, Rejected tabs
- **Status Badges**: Replaced inline status with StatusBadge
- **Toast Integration**: Success/error notifications
- **Loading States**: Shows "Loading…" during fetch
- **Result Count**: Displays number of filtered results
- **Auto-refresh**: Refetches after status changes

### Audit Logs API
- **File**: `apps/admin-portal/src/app/api/audit-logs/route.ts`
- **Features**: Pagination (page, pageSize), protected with auth
- **Default**: 20 logs per page, max 100

### Audit Logs Page
- **File**: `apps/admin-portal/src/app/audit-logs/page.tsx`
- **Features**: Full audit trail viewer, pagination, formatted JSON metadata
- **Columns**: When, Actor, Action, Entity, Entity ID, Metadata

### Type Definitions
- **Added**: `AuditLog` interface to `@repo/types`

### Files Created
- `apps/admin-portal/src/components/StatusBadge.tsx`
- `apps/admin-portal/src/components/Toast.tsx`
- `apps/admin-portal/src/app/api/audit-logs/route.ts`
- `apps/admin-portal/src/app/audit-logs/page.tsx`

### Next Steps (Optional Enhancements)
1. Add CSV export for requests
2. Add search across company/email fields
3. Add offer visibility management UI (Everflow sync)
4. Add bulk approve/reject actions
5. Add advanced filtering (date range, multiple statuses)
6. Add audit log filtering by actor/action/entity

