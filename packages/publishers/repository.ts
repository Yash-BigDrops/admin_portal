import { getPool } from "@repo/database";
import type {
  PublisherApplication,
  PublisherApplicationFile,
  PublisherFormConfig,
  ListPublisherApplicationsOptions,
  UpdatePublisherApplicationStatusInput,
} from "./types";

export async function listPublisherApplications(
  options: ListPublisherApplicationsOptions = {}
): Promise<PublisherApplication[]> {
  const { status, limit = 50, offset = 0 } = options;
  const pool = getPool();
  const args: unknown[] = [];
  const where: string[] = [];

  if (status) {
    where.push(`status = $${args.length + 1}`);
    args.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT 
      id,
      status,
      config_version as "configVersion",
      payload,
      ip_address as "ipAddress",
      user_agent as "userAgent",
      internal_notes as "internalNotes",
      publisher_id as "publisherId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM publisher_applications
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
    [...args, limit, offset]
  );

  return rows;
}

export async function getPublisherApplicationById(
  id: string
): Promise<PublisherApplication | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 
      id,
      status,
      config_version as "configVersion",
      payload,
      ip_address as "ipAddress",
      user_agent as "userAgent",
      internal_notes as "internalNotes",
      publisher_id as "publisherId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM publisher_applications
    WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

export async function listFilesForApplication(
  applicationId: string
): Promise<PublisherApplicationFile[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 
      id,
      application_id as "applicationId",
      storage_key as "storageKey",
      original_name as "originalName",
      size_bytes as "sizeBytes",
      mime_type as "mimeType",
      source,
      is_html as "isHtml",
      is_image as "isImage",
      created_at as "createdAt"
    FROM publisher_application_files
    WHERE application_id = $1
    ORDER BY created_at ASC`,
    [applicationId]
  );

  return rows;
}

export async function updatePublisherApplicationStatus(
  input: UpdatePublisherApplicationStatusInput
): Promise<PublisherApplication> {
  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE publisher_applications
    SET status = $1,
        internal_notes = COALESCE($2, internal_notes),
        updated_at = NOW()
    WHERE id = $3
    RETURNING 
      id,
      status,
      config_version as "configVersion",
      payload,
      ip_address as "ipAddress",
      user_agent as "userAgent",
      internal_notes as "internalNotes",
      publisher_id as "publisherId",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [input.status, input.internalNotes ?? null, input.id]
  );

  if (rows.length === 0) {
    throw new Error("Publisher application not found");
  }

  return rows[0];
}

export async function getActivePublisherFormConfigInternal(): Promise<PublisherFormConfig | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 
      id,
      version,
      is_active as "isActive",
      config,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM publisher_form_configs
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1`
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    id: row.id,
    version: row.version,
    isActive: row.isActive,
    sections: row.config.sections || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function savePublisherFormConfigInternal(
  config: Omit<PublisherFormConfig, "id" | "createdAt" | "updatedAt">
): Promise<PublisherFormConfig> {
  const pool = getPool();

  await pool.query(
    `UPDATE publisher_form_configs
    SET is_active = false
    WHERE is_active = true`
  );

  const { rows } = await pool.query(
    `INSERT INTO publisher_form_configs (version, is_active, config)
    VALUES ($1, $2, $3)
    RETURNING 
      id,
      version,
      is_active as "isActive",
      config,
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      config.version,
      config.isActive,
      JSON.stringify({ sections: config.sections }),
    ]
  );

  const row = rows[0];
  return {
    id: row.id,
    version: row.version,
    isActive: row.isActive,
    sections: row.config.sections || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createPublisherFromApplication(
  application: PublisherApplication
): Promise<{ publisherId: string }> {
  const pool = getPool();

  const { rows: publisherRows } = await pool.query(
    `SELECT gen_random_uuid() as "publisherId"`
  );

  const publisherId = publisherRows[0].publisherId;

  await pool.query(
    `UPDATE publisher_applications
    SET publisher_id = $1,
        updated_at = NOW()
    WHERE id = $2`,
    [publisherId, application.id]
  );

  return { publisherId };
}

