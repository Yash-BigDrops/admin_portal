import { getAdminSession } from '@/lib/auth-helpers'
import RequestsTable from '@/components/RequestsTable'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getAdminSession()
  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-2">Unauthorized</h1>
        <p className="text-gray-600 mb-4">Please sign in to access the dashboard.</p>
        <a
          href="/auth/signin"
          className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Sign In
        </a>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Publisher Requests</h1>
      <RequestsTable />
    </div>
  )
}

