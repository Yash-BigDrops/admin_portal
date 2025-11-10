# Apps

This directory contains all application portals in the monorepo.

## Portals

- **admin-portal** - Admin dashboard for managing publishers, requests, and system administration
- **publisher-portal** - Portal for publishers to submit requests and manage their account
- **advertiser-portal** - Portal for advertisers to manage campaigns and view analytics

## Structure

Each portal is a standalone Next.js application that can be developed and deployed independently.

## Development

Run all apps:
```bash
npm run dev
```

Run a specific app:
```bash
cd apps/admin-portal && npm run dev
```

## Shared Packages

All apps use shared packages from `packages/`:
- `@repo/ui` - Shared UI components
- `@repo/database` - Database utilities
- `@repo/auth` - Authentication & RBAC
- `@repo/types` - TypeScript types
- `@repo/config` - Configuration constants

