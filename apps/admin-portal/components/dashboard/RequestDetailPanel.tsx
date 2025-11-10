'use client'

import React from 'react'
import { X, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@repo/ui'
import { Textarea } from '@repo/ui'
import { Label } from '@repo/ui'

interface RequestData {
  id: string
  date?: string
  company?: string
  companyName?: string
  offerId: string
  offerName?: string
  offerDescription?: string
  offerPayout?: number | null
  offerCurrency?: string
  advertiserId?: string
  advertiserName?: string
  type?: string
  creativeType?: string
  priority: string
  status: 'pending' | 'admin_approved' | 'admin_rejected' | 'approved' | 'rejected'
  publisherName: string
  email: string
  submittedData: Record<string, unknown>
  adminNotes?: string
  createdAt?: string
  updatedAt?: string
}

interface RequestDetailPanelProps {
  request: RequestData | null
  isOpen: boolean
  onClose: () => void
  onApprove: (requestId: string, notes: string) => Promise<void>
  onReject: (requestId: string, notes: string) => Promise<void>
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  admin_approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  admin_rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
}

export function RequestDetailPanel({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: RequestDetailPanelProps) {
  if (!isOpen || !request) return null

  const [adminNotes, setAdminNotes] = React.useState('')
  const [processing, setProcessing] = React.useState(false)
  const StatusIcon = statusConfig[request.status]?.icon || Clock
  const statusInfo = statusConfig[request.status] || statusConfig.pending

  const handleApprove = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await onApprove(request.id, adminNotes)
      setAdminNotes('')
      onClose()
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to approve request. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await onReject(request.id, adminNotes)
      setAdminNotes('')
      onClose()
    } catch (error) {
      console.error('Rejection error:', error)
      alert('Failed to reject request. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color.split(' ')[0]}`} />
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="text-sm text-gray-500">ID: {request.id.slice(-8)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Publisher Name</Label>
              <p className="text-sm font-medium">{request.publisherName}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="text-sm font-medium">{request.email}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Company</Label>
              <p className="text-sm font-medium">{request.company || request.companyName || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Created</Label>
              <p className="text-sm font-medium">
                {request.date || (request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A')}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Offer ID</Label>
              <p className="text-sm font-medium">{request.offerId}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Creative Type</Label>
              <p className="text-sm font-medium">{request.type || request.creativeType || 'N/A'}</p>
            </div>
          </div>

          {request.offerName && (
            <div>
              <Label className="text-xs text-gray-500">Offer Name</Label>
              <p className="text-sm font-medium">{request.offerName}</p>
            </div>
          )}

          {request.offerDescription && (
            <div>
              <Label className="text-xs text-gray-500">Offer Description</Label>
              <p className="text-sm text-gray-700">{request.offerDescription}</p>
            </div>
          )}

          {request.adminNotes && (
            <div>
              <Label className="text-xs text-gray-500">Admin Notes</Label>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{request.adminNotes}</p>
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Submitted Data</Label>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(request.submittedData, null, 2)}
            </pre>
          </div>

          {request.status === 'pending' && (
            <div className="border-t pt-6 space-y-4">
              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

