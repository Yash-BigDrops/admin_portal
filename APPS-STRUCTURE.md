# Apps Folder Structure

## ✅ Current Structure

The `apps/` folder contains **only** the three portals:

```
apps/
├── admin-portal/      # Admin dashboard application
├── publisher-portal/  # Publisher portal application
└── advertiser-portal/ # Advertiser portal application
```

## 📁 Portal Details

### admin-portal
- **Purpose**: Admin dashboard for managing publishers, requests, and system administration
- **Status**: Fully migrated with fresh backend
- **Tech**: Next.js v16 canary, NextAuth, RBAC
- **API Routes**: Auth, Dashboard, Requests management

### publisher-portal
- **Purpose**: Portal for publishers to submit requests and manage their account
- **Status**: Clean scaffold ready for development
- **Tech**: Next.js v16 canary

### advertiser-portal
- **Purpose**: Portal for advertisers to manage campaigns and view analytics
- **Status**: Clean scaffold ready for development
- **Tech**: Next.js v16 canary

## 🎯 Clean Structure

- ✅ No extra files in `apps/` root
- ✅ Only three portal directories
- ✅ Each portal is self-contained
- ✅ All shared logic in `packages/`

## 📦 Shared Packages

All portals use:
- `@repo/ui` - UI components
- `@repo/database` - Database utilities
- `@repo/auth` - Authentication & RBAC
- `@repo/types` - TypeScript types
- `@repo/config` - Configuration

## 🚀 Development

```bash
# Run all apps
npm run dev

# Run specific app
cd apps/admin-portal && npm run dev
cd apps/publisher-portal && npm run dev
cd apps/advertiser-portal && npm run dev
```

