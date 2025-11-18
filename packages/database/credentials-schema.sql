-- Secure credentials storage table
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  encrypted_secret TEXT,
  encrypted_data JSONB,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_platform ON integration_credentials(platform);
CREATE INDEX IF NOT EXISTS idx_credentials_account ON integration_credentials(account_name);
CREATE INDEX IF NOT EXISTS idx_credentials_created_by ON integration_credentials(created_by);

