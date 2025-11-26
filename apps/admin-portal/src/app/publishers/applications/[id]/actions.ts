"use server";

import {
  updatePublisherApplicationStatus,
  type PublisherApplicationStatus,
} from "@repo/publishers";
import { auth } from "@/auth";
import { writeAudit } from "@repo/database";
import { redirect } from "next/navigation";

export async function updateApplicationStatusAction(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as PublisherApplicationStatus;
  const internalNotesValue = formData.get("internalNotes");
  const internalNotes =
    typeof internalNotesValue === "string" ? internalNotesValue : null;

  const allowedStatuses: PublisherApplicationStatus[] = [
    "pending",
    "under_review",
    "approved",
    "rejected",
  ];
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  await updatePublisherApplicationStatus({
    id,
    status,
    internalNotes,
  });

  await writeAudit(
    session.user?.email || "unknown",
    "publisher_application.status.updated",
    "publisher_application",
    id,
    {
      applicationId: id,
      status,
    }
  );

  redirect(`/publishers/applications/${id}`);
}

