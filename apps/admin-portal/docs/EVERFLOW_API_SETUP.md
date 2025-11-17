# Everflow API Configuration Guide

## Overview
The Everflow API is now configured across the entire codebase using a shared client that follows the [official Everflow API documentation](https://developers.everflow.io/docs/user-guide/). The client provides a centralized way to interact with all Everflow API endpoints.

## Environment Variables

Add these to `apps/admin-portal/.env.local`:

```env
# Everflow API Configuration
EVERFLOW_API_KEY=G5sv3yETjSgLmVcfB6Q
EVERFLOW_API_URL=https://api.eflow.team/v1
```

**Important:** After adding environment variables, you must restart the dev server for them to take effect.

## Shared Client

The Everflow API client is available in `@repo/config` package:

```typescript
import { everflowClient } from '@repo/config'

// Get all publishers
const publishers = await everflowClient.getPublishers()

// Get publishers with filters
const filteredPublishers = await everflowClient.getPublishers({
  status: 'active',
  limit: 50
})

// Get single publisher
const publisher = await everflowClient.getPublisher(publisherId)

// Get all offers
const offers = await everflowClient.getOffers()

// Get single offer
const offer = await everflowClient.getOffer(offerId)

// Get all advertisers
const advertisers = await everflowClient.getAdvertisers()

// Get single advertiser
const advertiser = await everflowClient.getAdvertiser(advertiserId)

// Get analytics/reporting data
const analytics = await everflowClient.getAnalytics({
  start_date: '2024-01-01',
  end_date: '2024-01-31'
})

// Get affiliates
const affiliates = await everflowClient.getAffiliates()

// Get single affiliate
const affiliate = await everflowClient.getAffiliate(affiliateId)
```

## API Routes

### Available Endpoints

1. **GET /api/everflow/publishers**
   - Fetches publishers from Everflow API
   - Query params: Any Everflow API parameters
   - Returns: `{ data: [...], total: number }`

2. **GET /api/everflow/offers**
   - Fetches offers from Everflow API
   - Query params: Any Everflow API parameters
   - Returns: `{ data: [...], total: number }`

3. **GET /api/everflow/advertisers**
   - Fetches advertisers from Everflow API
   - Query params: Any Everflow API parameters
   - Returns: `{ data: [...], total: number }`

4. **GET /api/everflow/analytics**
   - Fetches analytics/reporting data from Everflow API
   - Query params: Any Everflow API parameters
   - Returns: `{ data: [...], total: number }`

## Usage in Components

### Using Hooks (Client Components)

```typescript
'use client'
import { usePublishers, useOffers, useAnalytics } from '@/lib/hooks/useEverflowData'

export function MyComponent() {
  const { publishers, isLoading, error } = usePublishers()
  const { offers } = useOffers()
  const { analytics } = useAnalytics()
  
  // Use the data
}
```

### Using Direct API Calls (Server Components)

```typescript
import { everflowClient } from '@repo/config'

export async function MyServerComponent() {
  const publishers = await everflowClient.getPublishers()
  
  return <div>{/* Render publishers */}</div>
}
```

## Pull Advertiser from API

The "Pull Via API" feature in Manage Advertisers now uses the Everflow API:

1. Select platform: "Everflow"
2. Enter advertiser ID from Everflow
3. System fetches advertiser data from Everflow API
4. Stores in local database

## Error Handling

All API routes include:
- Authentication checks
- Permission checks (MANAGE_PUBLISHERS or VIEW_ANALYTICS)
- Error handling with detailed messages
- Development mode error details

## Files Created/Updated

1. **packages/config/src/everflow.ts** - Shared Everflow API client
2. **apps/admin-portal/app/api/everflow/publishers/route.ts** - Updated to use real API
3. **apps/admin-portal/app/api/everflow/offers/route.ts** - New route
4. **apps/admin-portal/app/api/everflow/analytics/route.ts** - New route
5. **apps/admin-portal/app/api/everflow/advertisers/route.ts** - New route
6. **apps/admin-portal/app/api/advertisers/pull/route.ts** - Updated to use Everflow API

## Next Steps

1. ✅ Add environment variables to `.env.local`
2. ✅ Restart dev server
3. ✅ Test API endpoints
4. ✅ Use in components throughout the codebase

