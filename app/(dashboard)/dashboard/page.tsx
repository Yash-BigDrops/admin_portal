import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { RequestsTable } from '@/components/dashboard/RequestsTable';
import { AdvertiserResponsesTable } from '@/components/dashboard/AdvertiserResponsesTable';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome to BigDrops Admin Portal. Manage publishers, advertisers, and creative approvals.
        </p>
      </div>

      {/* Metrics cards */}
      <MetricsCards />

      {/* Incoming Publisher Requests section */}
      <RequestsTable />
      
      {/* Incoming Advertiser Response section */}
      <AdvertiserResponsesTable />
    </div>
  );
}
