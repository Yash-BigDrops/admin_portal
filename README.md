# Multi-Portal Monorepo

A Turborepo monorepo containing multiple Next.js portals for managing publishers, advertisers, and admin operations.

## Structure

```
.
├── apps/
│   ├── admin-portal/      # Admin Portal (port 3000)
│   ├── publisher-portal/  # Publisher Portal (port 3001)
│   └── advertiser-portal/ # Advertiser Portal (port 3002)
├── packages/
│   ├── ui/                # Shared UI components
│   ├── database/          # Shared database utilities
│   ├── auth/              # Shared authentication
│   ├── config/            # Shared configuration
│   └── types/             # Shared TypeScript types
├── turbo.json             # Turborepo configuration
└── pnpm-workspace.yaml    # Workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, pnpm, or yarn

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Or with pnpm
pnpm install
```

### Development

Run all apps in development mode:

```bash
npm run dev
```

Run a specific app:

```bash
# Admin Portal (port 3000)
cd apps/admin-portal && npm run dev

# Publisher Portal (port 3001)
cd apps/publisher-portal && npm run dev

# Advertiser Portal (port 3002)
cd apps/advertiser-portal && npm run dev
```

### Building

Build all apps:

```bash
npm run build
```

Build a specific app:

```bash
cd apps/admin-portal && npm run build
```

### Testing

Run all tests:

```bash
npm run test
```

Run tests for a specific app:

```bash
cd apps/admin-portal && npm run test
```

## Workspace Packages

### @repo/ui
Shared UI components built with Radix UI and Tailwind CSS.

### @repo/database
Shared database connection and utilities using PostgreSQL.

### @repo/auth
Shared authentication and authorization utilities.

### @repo/config
Shared configuration constants and API endpoints.

### @repo/types
Shared TypeScript types and interfaces.

## Migration

If you're migrating from the single-app structure, see [MONOREPO-MIGRATION.md](./MONOREPO-MIGRATION.md) for detailed instructions.

## Deployment

Each app can be deployed independently to Vercel or other platforms. Configure each app's deployment settings in:

- `apps/admin-portal/vercel.json`
- `apps/publisher-portal/vercel.json`
- `apps/advertiser-portal/vercel.json`

## Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps
- `npm run lint` - Lint all workspaces
- `npm run test` - Run all tests
- `npm run clean` - Clean all build artifacts
- `npm run format` - Format code with Prettier

## Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
