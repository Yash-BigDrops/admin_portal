"use server";

import {
  savePublisherFormConfig,
  validatePublisherFormConfig,
  type PublisherFormConfig,
} from "@repo/publishers";
import { auth } from "@/auth";
import { writeAudit } from "@repo/database";

export async function savePublisherFormConfigAction(
  rawConfig: PublisherFormConfig
) {
  // 1) Authz: admin-only
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // 2) Validate structure and limits
  const validatedConfig = validatePublisherFormConfig(rawConfig);

  // 3) Save to DB
  const savedConfig = await savePublisherFormConfig(validatedConfig);

  // 4) Audit trail
  await writeAudit(
    session.user?.email || "unknown",
    "publisher_form.config.updated",
    "publisher_form_config",
    savedConfig.id,
    {
      formId: savedConfig.id,
      sections: savedConfig.sections.length,
    }
  );
}

