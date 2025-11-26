import { getAdminSession } from '@/lib/auth-helpers'
import { getPool } from '@repo/database'

export const dynamic = 'force-dynamic'

async function fetchLogs(page = 1) {
  const pageSize = 20
  const offset = (page - 1) * pageSize

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT actor_email, action, entity, entity_id, metadata, created_at,
            COUNT(*) OVER() AS __total
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  )

  const total = rows[0]?.__total ?? 0
  rows.forEach((r: any) => delete r.__total)

  return { data: rows, page, pageSize, total }
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const session = await getAdminSession()
  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold mb-2">Unauthorized</h1>
        <p className="text-gray-600 mb-4">Please sign in to access audit logs.</p>
        <a
          href="/auth/signin"
          className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Sign In
        </a>
      </div>
    )
  }

  const page = Number(searchParams?.page || 1)
  const { data, total, pageSize } = await fetchLogs(page)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Audit Logs</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">When</th>
            <th className="p-2 text-left">Actor</th>
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">Entity</th>
            <th className="p-2 text-left">Entity ID</th>
            <th className="p-2 text-left">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-2">{r.actor_email}</td>
              <td className="p-2">{r.action}</td>
              <td className="p-2">{r.entity}</td>
              <td className="p-2 font-mono text-xs">{r.entity_id}</td>
              <td className="p-2 text-xs break-all">
                <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(r.metadata, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="p-4 text-gray-500" colSpan={6}>
                No logs.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-3 flex gap-2 items-center">
        <a
          className={`underline ${page <= 1 ? 'text-gray-400 pointer-events-none' : ''}`}
          href={`/audit-logs?page=${Math.max(1, page - 1)}`}
        >
          Prev
        </a>
        <span className="text-gray-500">
          Page {page} of {totalPages || 1} ({total} total)
        </span>
        <a
          className={`underline ${page >= totalPages ? 'text-gray-400 pointer-events-none' : ''}`}
          href={`/audit-logs?page=${page + 1}`}
        >
          Next
        </a>
      </div>
    </div>
  )
}

