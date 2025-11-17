'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@repo/ui'
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui'
import { RequestDetailPanel } from './RequestDetailPanel'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface RequestData {
  id: string
  date: string
  company: string
  offerId: string
  offerName: string
  offerDescription: string
  offerPayout: number | null
  offerCurrency: string
  advertiserId: string
  advertiserName: string
  type: string
  priority: 'High Priority' | 'Moderate Priority' | 'Low Priority'
  status: 'pending' | 'admin_approved' | 'admin_rejected' | 'approved' | 'rejected'
  publisherName: string
  email: string
  submittedData: Record<string, unknown>
  adminNotes?: string
}

interface RequestsResponse {
  requests: RequestData[]
  total?: number
  limit?: number
  offset?: number
}

const priorityColors = {
  'High Priority': 'text-red-700 bg-red-100 border-red-200',
  'Moderate Priority': 'text-orange-700 bg-orange-100 border-orange-200',
  'Low Priority': 'text-green-700 bg-green-100 border-green-200',
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  admin_approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  admin_rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
}

export function RequestsTableEnhanced() {
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })

  const buildQueryParams = () => {
    const params = new URLSearchParams()
    params.set('limit', '50')
    params.set('offset', '0')
    if (searchQuery) params.set('q', searchQuery)
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter && priorityFilter !== 'all') params.set('priority', priorityFilter)
    if (dateRange.from) params.set('from', dateRange.from)
    if (dateRange.to) params.set('to', dateRange.to)
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
    return params.toString()
  }

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const queryString = buildQueryParams()
      const response = await fetch(`/api/dashboard/requests?${queryString}`)
      if (response.ok) {
        const data: RequestsResponse = await response.json()
        setRequests(data.requests)
        setTotal(data.total || data.requests.length)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchRequests()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, statusFilter, priorityFilter, dateRange, sortBy, sortOrder])

  const handleViewRequest = async (request: RequestData) => {
    try {
      const response = await fetch(`/api/dashboard/requests/${request.id}`)
      if (response.ok) {
        const data = await response.json()
        const fullRequest = {
          ...data.request,
          company: data.request.companyName || request.company,
          type: data.request.creativeType || request.type,
          date: data.request.createdAt 
            ? new Date(data.request.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : request.date,
          priority: request.priority,
        }
        setSelectedRequest(fullRequest)
        setShowDetailPanel(true)
      }
    } catch (error) {
      console.error('Error fetching request details:', error)
    }
  }

  const handleApprove = async (requestId: string, notes: string) => {
    const response = await fetch(`/api/dashboard/requests/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', adminNotes: notes }),
    })

    if (response.ok) {
      await fetchRequests()
    } else {
      throw new Error('Failed to approve request')
    }
  }

  const handleReject = async (requestId: string, notes: string) => {
    const response = await fetch(`/api/dashboard/requests/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', adminNotes: notes }),
    })

    if (response.ok) {
      await fetchRequests()
    } else {
      throw new Error('Failed to reject request')
    }
  }

  const quickDateFilters = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
  ]

  const applyQuickDateFilter = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setDateRange({ from: '', to: '' })
    setSortBy('created_at')
    setSortOrder('DESC')
  }

  const hasActiveFilters = searchQuery || (statusFilter && statusFilter !== 'all') || (priorityFilter && priorityFilter !== 'all') || dateRange.from || dateRange.to

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Publisher Requests</h3>
          {total > 0 && (
            <span className="text-sm text-gray-500">{total} {total === 1 ? 'request' : 'requests'}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by publisher, company, email, offer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="admin_approved">Approved</SelectItem>
              <SelectItem value="admin_rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quick filters:</span>
            {quickDateFilters.map((filter) => (
              <Button
                key={filter.value}
                variant="outline"
                size="sm"
                onClick={() => applyQuickDateFilter(filter.value)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
            {statusFilter === 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="text-xs"
              >
                Pending Only
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="publisher_name">Publisher</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No requests found</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters to see all requests
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusInfo = statusConfig[request.status] || statusConfig.pending
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color.split(' ')[0]}`} />
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">{request.date}</span>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">{request.publisherName}</p>
                        <p className="text-sm text-gray-600">{request.company} • {request.email}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Offer: <span className="font-medium">{request.offerId}</span></span>
                        <span>Type: <span className="font-medium">{request.type}</span></span>
                        <span className={cn("px-2 py-1 rounded text-xs font-medium border", priorityColors[request.priority])}>
                          {request.priority}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                      >
                        View Details
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={async () => {
                              const response = await fetch(`/api/dashboard/requests/${request.id}`)
                              if (response.ok) {
                                const data = await response.json()
                                const fullRequest = {
                                  ...data.request,
                                  company: data.request.companyName || request.company,
                                  type: data.request.creativeType || request.type,
                                  date: data.request.createdAt 
                                    ? new Date(data.request.createdAt).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })
                                    : request.date,
                                  priority: request.priority,
                                }
                                setSelectedRequest(fullRequest)
                                setShowDetailPanel(true)
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const response = await fetch(`/api/dashboard/requests/${request.id}`)
                              if (response.ok) {
                                const data = await response.json()
                                const fullRequest = {
                                  ...data.request,
                                  company: data.request.companyName || request.company,
                                  type: data.request.creativeType || request.type,
                                  date: data.request.createdAt 
                                    ? new Date(data.request.createdAt).toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })
                                    : request.date,
                                  priority: request.priority,
                                }
                                setSelectedRequest(fullRequest)
                                setShowDetailPanel(true)
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <RequestDetailPanel
        request={selectedRequest}
        isOpen={showDetailPanel}
        onClose={() => {
          setShowDetailPanel(false)
          setSelectedRequest(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}

