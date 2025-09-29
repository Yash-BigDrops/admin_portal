import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { RequestsTable } from '@/components/dashboard/RequestsTable';

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

      {/* Incoming requests section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestsTable />
        
        {/* Incoming Advertiser Response - Similar table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Incoming Advertiser Response
              </h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-500">
                View All
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Similar table structure for advertiser responses...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
