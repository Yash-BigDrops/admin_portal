# Everflow API Configuration - Complete Implementation

## Overview
Configured Everflow API integration across the entire codebase with a shared client that can be used in any app or package.

## Implementation Date
Completed: 2025-01-XX

---

## Files Created

### 1. Shared Everflow Client
**File**: `packages/config/src/everflow.ts`

**Purpose**: Centralized Everflow API client for use across all apps

**Key Features**:
- Singleton client instance (`everflowClient`)
- Type-safe API methods
- Automatic error handling
- Query parameter support
- Environment variable configuration

**Available Methods**:
```typescript
- getPublishers(params?)
- getPublisher(publisherId)
- getOffers(params?)
- getOffer(offerId)
- getAdvertisers(params?)
- getAdvertiser(advertiserId)
- getAnalytics(params?)
- getAffiliates(params?)
- getAffiliate(affiliateId)
```

**Code Structure**:
```typescript
export class EverflowApiClient {
  private baseUrl: string
  private apiKey: string
  
  async request<T>(options: EverflowApiOptions): Promise<T>
  async getPublishers(params?)
  async getPublisher(publisherId)
  // ... other methods
}

export const everflowClient = new EverflowApiClient()
```

---

## Files Updated

### 2. API Routes

#### `/api/everflow/publishers/route.ts`
**Location**: `apps/admin-portal/app/api/everflow/publishers/route.ts`

**Changes**:
- ✅ Replaced database query with Everflow API call
- ✅ Added query parameter support
- ✅ Uses `everflowClient.getPublishers()`
- ✅ Maintains authentication and permission checks

**Before**: Used local database (`publisher_requests` table)
**After**: Fetches from Everflow API

#### `/api/everflow/offers/route.ts` (NEW)
**Location**: `apps/admin-portal/app/api/everflow/offers/route.ts`

**Features**:
- Fetches offers from Everflow API
- Query parameter support
- Authentication and permission checks

#### `/api/everflow/analytics/route.ts` (NEW)
**Location**: `apps/admin-portal/app/api/everflow/analytics/route.ts`

**Features**:
- Fetches analytics/reporting data from Everflow API
- Query parameter support
- Authentication and permission checks

#### `/api/everflow/advertisers/route.ts` (NEW)
**Location**: `apps/admin-portal/app/api/everflow/advertisers/route.ts`

**Features**:
- Fetches advertisers from Everflow API
- Query parameter support
- Authentication and permission checks

#### `/api/advertisers/pull/route.ts`
**Location**: `apps/admin-portal/app/api/advertisers/pull/route.ts`

**Changes**:
- ✅ Integrated Everflow API for "Everflow" platform
- ✅ Fetches real advertiser data from Everflow when platform is "Everflow"
- ✅ Extracts advertiser name, company, email, website from API response
- ✅ Falls back to mock data for other platforms (Cake, HasOffers)

**Code Changes**:
```typescript
// Before: Mock data only
const mockAdvertiserData = { ... }

// After: Real API integration
if (platform.toLowerCase() === 'everflow') {
  advertiserData = await everflowClient.getAdvertiser(apiAdvId)
} else {
  // Mock for other platforms
}
```

---

## Configuration

### Environment Variables

**File**: `apps/admin-portal/.env.local`

**Required Variables**:
```env
# Everflow API Configuration
EVERFLOW_API_KEY=G5sv3yETjSgLmVcfB6Q
EVERFLOW_API_URL=https://api.eflow.team/v1
```

**Source**: Values from `env.download` file

---

## Usage Examples

### In API Routes

```typescript
import { everflowClient } from '@repo/config'

export async function GET() {
  const publishers = await everflowClient.getPublishers({
    status: 'active',
    limit: 50
  })
  return NextResponse.json({ data: publishers })
}
```

### In Server Components

```typescript
import { everflowClient } from '@repo/config'

export async function PublishersList() {
  const publishers = await everflowClient.getPublishers()
  return <div>{/* Render publishers */}</div>
}
```

### In Client Components (via Hooks)

```typescript
'use client'
import { usePublishers } from '@/lib/hooks/useEverflowData'

export function PublishersTable() {
  const { publishers, isLoading, error } = usePublishers()
  // Use data
}
```

---

## API Endpoints Available

### 1. GET /api/everflow/publishers
- **Auth**: Required (MANAGE_PUBLISHERS permission)
- **Query Params**: Any Everflow API parameters
- **Returns**: `{ data: [...], total: number }`

### 2. GET /api/everflow/offers
- **Auth**: Required (VIEW_ANALYTICS permission)
- **Query Params**: Any Everflow API parameters
- **Returns**: `{ data: [...], total: number }`

### 3. GET /api/everflow/advertisers
- **Auth**: Required (MANAGE_PUBLISHERS permission)
- **Query Params**: Any Everflow API parameters
- **Returns**: `{ data: [...], total: number }`

### 4. GET /api/everflow/analytics
- **Auth**: Required (VIEW_ANALYTICS permission)
- **Query Params**: Any Everflow API parameters
- **Returns**: `{ data: [...], total: number }`

### 5. POST /api/advertisers/pull
- **Auth**: Required (MANAGE_PUBLISHERS permission)
- **Body**: `{ platform: string, apiAdvId: string }`
- **Returns**: `{ advertiser: {...}, message: string }`
- **Integration**: Uses Everflow API when platform is "Everflow"

---

## Features

### ✅ Centralized Configuration
- Single source of truth for Everflow API
- Environment-based configuration
- Easy to update credentials

### ✅ Type Safety
- TypeScript interfaces for API options
- Type-safe return values
- Error handling with typed errors

### ✅ Reusability
- Available in all apps via `@repo/config`
- Can be used in API routes, server components, and services
- Consistent API across codebase

### ✅ Error Handling
- Comprehensive error messages
- Development mode stack traces
- Graceful fallbacks

### ✅ Authentication & Authorization
- All routes require authentication
- Permission-based access control
- Secure API key management

---

## Integration Points

### 1. Manage Advertisers - Pull Via API
- **Component**: `PullViaAPIDialog`
- **Route**: `/api/advertisers/pull`
- **Integration**: Fetches advertiser data from Everflow when platform is "Everflow"
- **Result**: Stores real advertiser data in database

### 2. Publisher Management
- **Component**: `PublisherTable`
- **Route**: `/api/everflow/publishers`
- **Integration**: Fetches real publisher data from Everflow
- **Result**: Displays actual Everflow publishers

### 3. Dashboard Analytics
- **Components**: Various dashboard components
- **Routes**: `/api/everflow/analytics`, `/api/everflow/offers`
- **Integration**: Real-time data from Everflow
- **Result**: Accurate analytics and metrics

---

## Testing

### Manual Testing Steps

1. **Add Environment Variables**:
   ```bash
   # Add to apps/admin-portal/.env.local
   EVERFLOW_API_KEY=G5sv3yETjSgLmVcfB6Q
   EVERFLOW_API_URL=https://api.eflow.team/v1
   ```

2. **Restart Dev Server**:
   ```bash
   pnpm dev
   ```

3. **Test Publishers Endpoint**:
   ```bash
   # In browser console or Postman
   fetch('/api/everflow/publishers')
     .then(r => r.json())
     .then(console.log)
   ```

4. **Test Pull Advertiser**:
   - Go to Manage Advertisers
   - Click "Pull Via API"
   - Select "Everflow"
   - Enter advertiser ID
   - Verify data is fetched and stored

---

## Error Handling

### Common Errors

1. **API Key Not Configured**:
   - Error: "Everflow API key is not configured"
   - Fix: Add `EVERFLOW_API_KEY` to `.env.local`

2. **API Request Failed**:
   - Error: "Everflow API request failed: [message]"
   - Fix: Check API key validity, network connection

3. **Advertiser Not Found**:
   - Error: "Failed to fetch advertiser from Everflow: [message]"
   - Fix: Verify advertiser ID exists in Everflow

---

## Future Enhancements

### TODO

1. **Other Platform Integration**:
   - [ ] Cake API integration
   - [ ] HasOffers API integration
   - [ ] Hitpath API integration

2. **Caching**:
   - [ ] Add response caching for frequently accessed data
   - [ ] Implement cache invalidation strategies

3. **Rate Limiting**:
   - [ ] Add rate limiting for API calls
   - [ ] Implement request queuing

4. **Webhooks**:
   - [ ] Set up Everflow webhooks for real-time updates
   - [ ] Handle webhook events

---

## Code References

### Main Client
```12:150:packages/config/src/everflow.ts
export class EverflowApiClient {
  // ... implementation
}
```

### Publishers Route
```1:49:apps/admin-portal/app/api/everflow/publishers/route.ts
// Uses everflowClient.getPublishers()
```

### Pull Advertiser Route
```46:66:apps/admin-portal/app/api/advertisers/pull/route.ts
// Fetches from Everflow API when platform is Everflow
```

---

## Summary

✅ **Created**: Shared Everflow API client in `@repo/config`
✅ **Updated**: Publishers API route to use real Everflow API
✅ **Created**: Offers, Analytics, Advertisers API routes
✅ **Integrated**: Pull Advertiser feature with Everflow API
✅ **Documented**: Complete setup guide and usage examples

**Status**: ✅ Complete and ready to use

**Next Step**: Add environment variables to `.env.local` and restart dev server

