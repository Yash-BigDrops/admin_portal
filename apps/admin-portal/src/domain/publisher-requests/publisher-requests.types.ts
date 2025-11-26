export type PublisherRequestStatus = 'pending' | 'approved' | 'rejected'

export type PublisherRequest = {
  id: string
  offer_id: string
  company: string | null
  email: string
  creative_type: string | null
  data: Record<string, unknown> | null
  status: PublisherRequestStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type ListPublisherRequestsOptions = {
  status?: PublisherRequestStatus
  search?: string
  page?: number
  pageSize?: number
}

export type ListPublisherRequestsResult = {
  data: PublisherRequest[]
  total: number
  page: number
  pageSize: number
}

export type UpdatePublisherRequestStatusInput = {
  status: 'approved' | 'rejected'
  admin_notes?: string | null
}

