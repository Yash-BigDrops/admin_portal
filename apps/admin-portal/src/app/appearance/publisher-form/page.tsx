import {
  AdminPublisherFormEditor,
  getActivePublisherFormConfig
} from "@repo/publishers";
import Sidebar from "@/components/Sidebar";
import { savePublisherFormConfigAction } from "./actions";

export default async function PublisherFormAppearancePage() {
  const initialConfig = await getActivePublisherFormConfig();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <div className="p-6 lg:p-8">
          <AdminPublisherFormEditor
            initialConfig={initialConfig}
            onSave={savePublisherFormConfigAction}
          />
        </div>
      </main>
    </div>
  );
}

