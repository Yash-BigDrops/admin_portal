# Monorepo Migration Guide
This guide explains how to complete the migration from a single Next.js app to a Turborepo monorepo structure.

## Structure

```
.
├── apps/
│   ├── admin-portal/      # Current Admin Portal (to be migrated)
│   ├── publisher-portal/   # New Publisher Portal
│   └── advertiser-portal/  # New Advertiser Portal
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── database/           # Shared database utilities
│   ├── auth/               # Shared authentication
│   ├── config/             # Shared configuration
│   └── types/              # Shared TypeScript types
├── turbo.json              # Turborepo configuration
├── pnpm-workspace.yaml     # Workspace configuration
└── package.json            # Root package.json
```

## Migration Steps

### Step 1: Move Current Codebase to apps/admin-portal

Move all current files (except those listed below) to `apps/admin-portal/`:

**Files to move:**
- `app/` → `apps/admin-portal/app/`
- `components/` → `apps/admin-portal/components/`
- `lib/` → `apps/admin-portal/lib/` (except shared code)
- `public/` → `apps/admin-portal/public/`
- `scripts/` → `apps/admin-portal/scripts/`
- `tests/` → `apps/admin-portal/tests/`
- `constants/` → `apps/admin-portal/constants/`
- `types/` → Move shared types to `packages/types/`
- `middleware.ts` → `apps/admin-portal/middleware.ts`
- `next.config.ts` → `apps/admin-portal/next.config.ts`
- `tsconfig.json` → `apps/admin-portal/tsconfig.json`
- `tailwind.config.js` → `apps/admin-portal/tailwind.config.js`
- `postcss.config.mjs` → `apps/admin-portal/postcss.config.mjs`
- `vitest.config.ts` → `apps/admin-portal/vitest.config.ts`
- `vitest.setup.ts` → `apps/admin-portal/vitest.setup.ts`
- `eslint.config.mjs` → `apps/admin-portal/eslint.config.mjs`
- `components.json` → `apps/admin-portal/components.json`
- `.env*` files → `apps/admin-portal/` (keep at root for shared config)

**Files to keep at root:**
- `package.json`
- `package-lock.json`
- `turbo.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `README.md`
- `MONOREPO-MIGRATION.md`

### Step 2: Update Import Paths

After moving files, update import paths in `apps/admin-portal/`:

**Before:**
```typescript
import { User } from '@/types/database'
import { getPool } from '@/lib/database/db'
```

**After:**
```typescript
import { User } from '@repo/types'
import { getPool } from '@repo/database'
```

### Step 3: Move Shared Code to Packages

#### Move to `packages/types/`:
- `types/database.ts` → Already done
- `types/auth.ts` → Already done
- `types/next-auth.d.ts` → Keep in admin-portal (app-specific)

#### Move to `packages/database/`:
- `lib/database/db.ts` → Already done in `packages/database/src/db.ts`

#### Move to `packages/auth/`:
- `lib/auth/require-auth.ts`
- `lib/rbac.ts`
- `lib/auth-config.ts`
- `lib/simple-auth.ts`
- `lib/simple-auth-config.ts`

#### Move to `packages/ui/`:
- `components/ui/*` → `packages/ui/src/components/`
- Shared components that can be used across portals

#### Move to `packages/config/`:
- `constants/api.ts` → `packages/config/src/api.ts`

### Step 4: Update tsconfig.json in apps/admin-portal

Update `apps/admin-portal/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@repo/ui": ["../../packages/ui"],
      "@repo/database": ["../../packages/database"],
      "@repo/auth": ["../../packages/auth"],
      "@repo/config": ["../../packages/config"],
      "@repo/types": ["../../packages/types"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 5: Install Dependencies

```bash
# Install Turborepo and workspace dependencies
npm install

# Or if using pnpm
pnpm install
```

### Step 6: Update Root package.json

Remove app-specific dependencies from root `package.json` and keep only:
- Turborepo
- Shared dev dependencies (TypeScript, ESLint, Prettier)
- Workspace management tools

### Step 7: Test the Setup

```bash
# Run all apps in development
npm run dev

# Build all apps
npm run build

# Run tests
npm run test
```

## Next Steps

1. Complete the file migration using the steps above
2. Update all import paths to use workspace packages
3. Test each portal independently
4. Set up CI/CD for the monorepo
5. Configure Vercel for multi-app deployment

## Troubleshooting

### Import errors
- Ensure all packages have proper `package.json` with `main` and `types` fields
- Check `tsconfig.json` paths configuration
- Verify workspace dependencies in each app's `package.json`

### Build errors
- Clear `.next` and `node_modules` directories
- Run `npm run clean` from root
- Reinstall dependencies

### Type errors
- Ensure `packages/types` is properly configured
- Check that all shared types are exported from package index files

