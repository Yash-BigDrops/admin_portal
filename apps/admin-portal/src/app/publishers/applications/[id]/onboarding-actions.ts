"use server";

import {
  getPublisherApplicationById,
  createPublisherFromApplication,
} from "@repo/publishers";
import { auth } from "@/auth";
import { writeAudit } from "@repo/database";
import { redirect } from "next/navigation";

export async function createPublisherFromApplicationAction(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const appId = String(formData.get("id") ?? "");
  const app = await getPublisherApplicationById(appId);
  if (!app) {
    throw new Error("Application not found");
  }

  if (app.publisherId) {
    throw new Error("Publisher already created for this application");
  }

  const { publisherId } = await createPublisherFromApplication(app);

  await writeAudit(
    session.user?.email || "unknown",
    "publisher_application.onboarded",
    "publisher_application",
    appId,
    {
      appId,
      publisherId,
    }
  );

  redirect(`/publishers/applications/${appId}`);
}

