'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PublisherRequest } from '@repo/types'
import RequestDetailPanel from './RequestDetailPanel'
import StatusBadge from './StatusBadge'
import { Toast } from './Toast'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

export default function RequestsTable() {
  const [requests, setRequests] = useState<PublisherRequest[]>([])
  const [selected, setSelected] = useState<PublisherRequest | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  const load = async (status?: string, query?: string, pageNum = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') params.set('status', status)
      if (query && query.trim()) params.set('q', query.trim())
      params.set('page', pageNum.toString())
      params.set('pageSize', pageSize.toString())
      const q = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/publisher-requests${q}`, { cache: 'no-store' })
      const json = await res.json()
      setRequests(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    load(tab === 'all' ? undefined : tab, searchQuery, 1)
  }, [tab, searchQuery])

  useEffect(() => {
    load(tab === 'all' ? undefined : tab, searchQuery, page)
  }, [page])

  const open = (r: PublisherRequest) => setSelected(r)
  const close = () => setSelected(null)

  const updateRow = (
    id: string,
    status: 'approved' | 'rejected',
    admin_notes?: string
  ) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              admin_notes,
              updated_at: new Date().toISOString() as any,
            }
          : r
      )
    )
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, status, admin_notes } as any : prev
    )
  }

  const patchStatus = async (
    id: string,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    const res = await fetch(`/api/publisher-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes ?? '' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || 'Failed to update status')
    }
  }

  const onApprove = async (id: string, notes?: string) => {
    const prev = requests.find((r) => r.id === id)
    updateRow(id, 'approved', notes)
    try {
      await patchStatus(id, 'approved', notes)
      setToast({ msg: 'Request approved', type: 'success' })
      await load(tab === 'all' ? undefined : tab, searchQuery, page)
    } catch (e: any) {
      if (prev) updateRow(id, prev.status as any, prev.admin_notes)
      setToast({ msg: e.message || 'Failed to approve', type: 'error' })
    }
  }

  const onReject = async (id: string, notes?: string) => {
    const prev = requests.find((r) => r.id === id)
    updateRow(id, 'rejected', notes)
    try {
      await patchStatus(id, 'rejected', notes)
      setToast({ msg: 'Request rejected', type: 'success' })
      await load(tab === 'all' ? undefined : tab, searchQuery, page)
    } catch (e: any) {
      if (prev) updateRow(id, prev.status as any, prev.admin_notes)
      setToast({ msg: e.message || 'Failed to reject', type: 'error' })
    }
  }

  const tabs: { key: Tab; label: string }[] = useMemo(
    () => [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'approved', label: 'Approved' },
      { key: 'rejected', label: 'Rejected' },
    ],
    []
  )

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (tab !== 'all') params.set('status', tab)
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    const q = params.toString() ? `?${params.toString()}` : ''
    window.open(`/api/publisher-requests.csv${q}`, '_blank')
  }

  return (
    <>
      <div className="mb-3 space-y-2">
        <div className="flex gap-2 items-center">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded border text-sm ${
                tab === t.key ? 'bg-black text-white' : 'bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search company or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-4 px-3 py-1.5 border rounded text-sm flex-1 max-w-xs"
          />
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded border text-sm bg-gray-100 hover:bg-gray-200"
          >
            Export CSV
          </button>
          <div className="ml-auto text-sm text-gray-500">
            {loading ? 'Loading…' : `${total} total`}
          </div>
        </div>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Company</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Offer ID</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr
              key={r.id}
              className="border-t hover:bg-gray-50 cursor-pointer"
              onClick={() => open(r)}
            >
              <td className="p-2">{r.company}</td>
              <td className="p-2">{r.email}</td>
              <td className="p-2">{r.offer_id}</td>
              <td className="p-2">
                <StatusBadge status={r.status as string} />
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td className="p-4 text-gray-500" colSpan={4}>
                No requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {total > 0 && (
        <div className="mt-3 flex gap-2 items-center">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className={`px-3 py-1.5 rounded border text-sm ${
              page <= 1 || loading
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / pageSize) || 1} ({total} total)
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / pageSize) || loading}
            className={`px-3 py-1.5 rounded border text-sm ${
              page >= Math.ceil(total / pageSize) || loading
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
          >
            Next
          </button>
        </div>
      )}

      <RequestDetailPanel
        request={selected}
        onClose={close}
        onApprove={onApprove}
        onReject={onReject}
      />

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
