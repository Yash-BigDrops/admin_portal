import { auth } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/rbac'
import RoleGuard from '@/components/RoleGuard'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import SubmissionsTrendChart from '@/components/dashboard/SubmissionsTrendChart'
import PublisherTable from '@/components/dashboard/PublisherTable'
import RecentActivity from '@/components/dashboard/RecentActivity'
import { RequestsTableEnhanced } from '@/components/dashboard/RequestsTableEnhanced';
import { AdvertiserResponsesTable } from '@/components/dashboard/AdvertiserResponsesTable';

export default async function DashboardPage() {
  const session = await auth()
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your affiliate marketing performance today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-gray-400">
            Role: {session?.user?.role || 'user'}
          </p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <RoleGuard permission={PERMISSIONS.VIEW_ANALYTICS}>
        <MetricsCards />
      </RoleGuard>
      
      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RoleGuard permission={PERMISSIONS.VIEW_ANALYTICS}>
          <SubmissionsTrendChart />
        </RoleGuard>
        
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
      
      {/* Incoming Publisher Requests section - Offers permission required */}
      <RoleGuard permission={PERMISSIONS.MANAGE_OFFERS}>
        <RequestsTableEnhanced />
      </RoleGuard>
      
      {/* Incoming Advertiser Response section - Publishers permission required */}
      <RoleGuard permission={PERMISSIONS.MANAGE_PUBLISHERS}>
        <AdvertiserResponsesTable />
      </RoleGuard>
      
      {/* Data Tables */}
      <RoleGuard permission={PERMISSIONS.MANAGE_PUBLISHERS}>
        <div className="mt-8">
          <PublisherTable />
        </div>
      </RoleGuard>
    </div>
  );
}
