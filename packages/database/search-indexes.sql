-- Search indexes for publisher_requests table
-- Run these once to improve search performance

CREATE INDEX IF NOT EXISTS idx_pr_company_lower ON publisher_requests (LOWER(company));
CREATE INDEX IF NOT EXISTS idx_pr_email_lower ON publisher_requests (LOWER(email));

