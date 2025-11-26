'use client'

import { useState } from 'react'
import { PublisherRequest } from '@repo/types'

interface RequestDetailPanelProps {
  request: PublisherRequest | null
  onClose: () => void
  onApprove: (id: string, notes?: string) => Promise<void>
  onReject: (id: string, notes?: string) => Promise<void>
}

export default function RequestDetailPanel({
  request,
  onClose,
  onApprove,
  onReject,
}: RequestDetailPanelProps) {
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!request) return null

  const disabled = submitting || request.status !== 'pending'

  const handleApprove = async () => {
    try {
      setSubmitting(true)
      setError(null)
      await onApprove(request.id, notes)
      setNotes('')
    } catch (error: any) {
      setError(error?.message || 'Failed to approve request')
      console.error('Approve failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    try {
      setSubmitting(true)
      setError(null)
      await onReject(request.id, notes)
      setNotes('')
    } catch (error: any) {
      setError(error?.message || 'Failed to reject request')
      console.error('Reject failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Request Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Company</label>
              <p className="text-lg">{request.company || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">
                <a
                  href={`mailto:${request.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {request.email}
                </a>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Offer ID</label>
              <p className="text-lg font-mono">{request.offer_id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {request.status}
                </span>
              </p>
            </div>

            {request.creative_type && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Creative Type
                </label>
                <p className="text-lg">{request.creative_type}</p>
              </div>
            )}

            {request.data && (
              <div>
                <label className="text-sm font-medium text-gray-500">Data</label>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(request.data, null, 2)}
                </pre>
              </div>
            )}

            {request.admin_notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Admin Notes
                </label>
                <p className="text-lg">{request.admin_notes}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">
                Created At
              </label>
              <p className="text-lg">
                {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Admin Notes (optional)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm resize-none"
                placeholder="Add notes about this decision..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setError(null)
                }}
                rows={3}
                disabled={submitting}
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {notes.length}/2000 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={disabled}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Processing...' : '❌ Reject'}
              </button>
              <button
                onClick={handleApprove}
                disabled={disabled}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Processing...' : '✅ Approve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

