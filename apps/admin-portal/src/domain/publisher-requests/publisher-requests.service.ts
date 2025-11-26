import {
  listPublisherRequests,
  getPublisherRequestById,
  updatePublisherRequestStatus,
} from './publisher-requests.repository'
import { writeAudit } from '@repo/database'
import type {
  ListPublisherRequestsOptions,
  ListPublisherRequestsResult,
  UpdatePublisherRequestStatusInput,
  PublisherRequest,
} from './publisher-requests.types'

export async function getPublisherRequestsForAdmin(
  options: ListPublisherRequestsOptions = {},
): Promise<ListPublisherRequestsResult> {
  return listPublisherRequests(options)
}

export async function getPublisherRequestDetails(
  id: string,
): Promise<PublisherRequest | null> {
  return getPublisherRequestById(id)
}

export async function updateRequestStatus(
  id: string,
  input: UpdatePublisherRequestStatusInput,
  actorEmail: string,
): Promise<PublisherRequest> {
  const updated = await updatePublisherRequestStatus(id, input)

  await writeAudit(
    actorEmail,
    'update_status',
    'publisher_request',
    id,
    {
      status: input.status,
      admin_notes: input.admin_notes ?? null,
    },
  )

  return updated
}

