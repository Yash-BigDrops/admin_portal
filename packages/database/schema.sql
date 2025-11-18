CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS publisher_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  creative_type TEXT,
  data JSONB,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publisher_requests_status ON publisher_requests(status);
CREATE INDEX IF NOT EXISTS idx_publisher_requests_created_at ON publisher_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  everflow_offer_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'hidden',
  payout NUMERIC(12, 2),
  currency TEXT,
  geo_targets TEXT[],
  data JSONB DEFAULT '{}'::jsonb,
  advertiser_id TEXT,
  advertiser_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_visibility ON offers (visibility);
CREATE INDEX IF NOT EXISTS idx_offers_everflow_offer_id ON offers (everflow_offer_id);

ALTER TABLE offers 
  ADD COLUMN IF NOT EXISTS advertiser_id TEXT,
  ADD COLUMN IF NOT EXISTS advertiser_name TEXT;

-- Publisher form configuration
CREATE TABLE IF NOT EXISTS publisher_form_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publisher_form_configs_active_created
  ON publisher_form_configs (is_active, created_at DESC);

-- Publisher applications
CREATE TABLE IF NOT EXISTS publisher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  config_version INTEGER,
  payload JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publisher_applications_status_created
  ON publisher_applications (status, created_at DESC);

ALTER TABLE publisher_applications
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE publisher_applications
  ADD COLUMN IF NOT EXISTS publisher_id UUID;

CREATE INDEX IF NOT EXISTS idx_publisher_applications_publisher_id
  ON publisher_applications (publisher_id);

-- Publisher application files (creative uploads)
CREATE TABLE IF NOT EXISTS publisher_application_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  storage_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  source TEXT NOT NULL,
  is_html BOOLEAN NOT NULL DEFAULT FALSE,
  is_image BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_application_files_application
    FOREIGN KEY (application_id) REFERENCES publisher_applications(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_publisher_application_files_app_id
  ON publisher_application_files (application_id);

