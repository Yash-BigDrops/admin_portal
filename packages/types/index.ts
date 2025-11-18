export interface PublisherRequest {
  id: string
  offer_id: string
  company?: string
  email: string
  creative_type?: string
  data?: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  created_at: Date
  updated_at: Date
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'publisher' | 'advertiser'
}

export interface AuditLog {
  actor_email: string
  action: string
  entity: string
  entity_id: string
  metadata: Record<string, any>
  created_at: string
}

