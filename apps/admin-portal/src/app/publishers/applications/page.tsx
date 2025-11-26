import {
  listPublisherApplications,
  type PublisherApplicationStatus,
} from "@repo/publishers";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function PublisherApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status as PublisherApplicationStatus | undefined;
  const apps = await listPublisherApplications({
    status,
    limit: 50,
    offset: 0,
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Publisher Applications</h1>

            <div className="flex gap-2 text-sm">
              {["all", "pending", "under_review", "approved", "rejected"].map(
                (s) => {
                  const val = s === "all" ? undefined : (s as PublisherApplicationStatus);
                  const isActive = status === val || (s === "all" && !status);

                  return (
                    <Link
                      key={s}
                      href={
                        val ? `?status=${encodeURIComponent(val)}` : "/publishers/applications"
                      }
                      className={`px-3 py-1 rounded-md border ${
                        isActive ? "bg-slate-900 text-white" : "bg-white"
                      }`}
                    >
                      {s}
                    </Link>
                  );
                }
              )}
            </div>
          </div>

          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-left px-3 py-2">IP</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono text-xs">
                      {a.id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">{a.status}</td>
                    <td className="px-3 py-2">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs">{a.ipAddress ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/publishers/applications/${a.id}`}
                        className="text-xs underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-slate-500 text-sm"
                    >
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

