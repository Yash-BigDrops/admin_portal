import {
  getPublisherApplicationById,
  listFilesForApplication,
  type PublisherApplicationStatus,
} from "@repo/publishers";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { updateApplicationStatusAction } from "./actions";
import { createPublisherFromApplicationAction } from "./onboarding-actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublisherApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const app = await getPublisherApplicationById(id);
  if (!app) notFound();
  
  const files = await listFilesForApplication(id);

  const statusOptions: PublisherApplicationStatus[] = [
    "pending",
    "under_review",
    "approved",
    "rejected",
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Publisher Application</h1>

            <div className="flex gap-2">
              <span className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-md">
                {app.id}
              </span>

              {!app.publisherId && (
                <form action={createPublisherFromApplicationAction}>
                  <input type="hidden" name="id" value={app.id} />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-md border text-xs font-medium bg-white hover:bg-slate-50 transition-colors"
                  >
                    Create Publisher
                  </button>
                </form>
              )}

              {app.publisherId && (
                <span className="font-mono text-xs bg-green-100 text-green-800 px-3 py-1 rounded-md">
                  Linked publisher: {app.publisherId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>

          <form
            action={updateApplicationStatusAction}
            className="space-y-4 border rounded-md p-4 bg-white"
          >
            <input type="hidden" name="id" value={app.id} />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  name="status"
                  defaultValue={app.status}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">IP address</label>
                <p className="text-sm text-slate-600">
                  {app.ipAddress ?? "Unknown"}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">User Agent</label>
                <p className="text-xs text-slate-600 wrap-break-word">
                  {app.userAgent ?? "Unknown"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Internal notes</label>
              <textarea
                name="internalNotes"
                defaultValue={app.internalNotes ?? ""}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-md border text-sm font-medium"
            >
              Save changes
            </button>
          </form>

          {files.length > 0 && (
            <div className="space-y-2 border rounded-md p-4 bg-slate-50">
              <h2 className="text-sm font-semibold">Uploaded Creatives</h2>
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between text-sm p-2 bg-white rounded border"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{f.originalName}</span>
                      <span className="text-slate-500 ml-2">
                        ({(f.sizeBytes / 1024 / 1024).toFixed(1)} MB)
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {f.mimeType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {f.source}
                      </span>
                      {f.isHtml && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                          HTML
                        </span>
                      )}
                      {f.isImage && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                          Image
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 border rounded-md p-4 bg-slate-50">
            <h2 className="text-sm font-semibold">Submitted payload</h2>
            <pre className="text-xs bg-white rounded-md p-3 overflow-x-auto">
              {JSON.stringify(app.payload, null, 2)}
            </pre>
          </div>

          <div className="space-y-1 text-xs text-slate-500">
            <p>Created at: {new Date(app.createdAt).toLocaleString()}</p>
            <p>Updated at: {new Date(app.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

