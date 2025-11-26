'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

type Offer = {
  id: string
  everflow_offer_id: string
  name: string
  status: string
  visibility: 'hidden' | 'internal' | 'public'
  advertiser_id: string | null
  advertiser_name: string | null
}

type FieldType =
  | 'visibility'
  | 'brandGuidelinesUrl'
  | 'notes'

type Change = {
  id: string
  fieldType: FieldType | ''
  value: string
}

export default function BulkEditPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'available' | 'selected'>('available')
  const [changes, setChanges] = useState<Change[]>([
    { id: '1', fieldType: '', value: '' },
  ])
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [offerSelectionExpanded, setOfferSelectionExpanded] = useState(true)

  async function loadOffers() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('sort', 'id_desc')
      params.set('limit', '1000')
      params.set('status', 'active')

      const res = await fetch(`/api/offers?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        setError(json.error || 'Failed to load offers.')
        return
      }
      setOffers(json.items ?? [])
    } catch (err) {
      console.error('[BulkEdit] Load error:', err)
      setError('Failed to load offers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOffers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOffers = useMemo(() => {
    if (!search.trim()) return offers

    const q = search.toLowerCase()
    return offers.filter((o) => {
      return (
        o.everflow_offer_id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        (o.advertiser_name ?? '').toLowerCase().includes(q) ||
        (o.advertiser_id ?? '').toLowerCase().includes(q)
      )
    })
  }, [offers, search])

  const availableOffers = useMemo(() => {
    return filteredOffers.filter((o) => !selectedIds.has(o.id))
  }, [filteredOffers, selectedIds])

  const selectedOffers = useMemo(() => {
    return filteredOffers.filter((o) => selectedIds.has(o.id))
  }, [filteredOffers, selectedIds])

  const displayedOffers =
    activeTab === 'available' ? availableOffers : selectedOffers

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  function selectAll() {
    const newSelected = new Set(selectedIds)
    availableOffers.forEach((o) => newSelected.add(o.id))
    setSelectedIds(newSelected)
  }

  function clearAll() {
    setSelectedIds(new Set())
  }

  function addChange() {
    setChanges([
      ...changes,
      { id: Date.now().toString(), fieldType: '', value: '' },
    ])
  }

  function removeChange(id: string) {
    setChanges(changes.filter((c) => c.id !== id))
  }

  function updateChange(id: string, updates: Partial<Change>) {
    setChanges(
      changes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    )
  }

  async function applyChanges() {
    if (selectedIds.size === 0) {
      setError('Please select at least one offer.')
      return
    }

    const validChanges = changes.filter(
      (c) => c.fieldType && c.value.trim(),
    )
    if (validChanges.length === 0) {
      setError('Please add at least one valid change.')
      return
    }

    setApplying(true)
    setError(null)
    setSuccess(null)

    try {
      const updates: Record<string, any> = {}
      for (const change of validChanges) {
        if (change.fieldType === 'visibility') {
          updates.visibility = change.value
        } else if (change.fieldType === 'brandGuidelinesUrl') {
          updates.brandGuidelinesUrl = change.value || null
        } else if (change.fieldType === 'notes') {
          updates.notes = change.value || null
        }
      }

      const res = await fetch('/api/offers/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerIds: Array.from(selectedIds),
          updates,
        }),
        credentials: 'include',
      })

      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        setError(json.error || json.details || 'Failed to apply changes.')
        return
      }

      setSuccess(
        `Successfully updated ${json.updated || selectedIds.size} offer(s).`,
      )
      setSelectedIds(new Set())
      setChanges([{ id: '1', fieldType: '', value: '' }])
      await loadOffers()
    } catch (err) {
      console.error('[BulkEdit] Apply error:', err)
      setError('Failed to apply changes.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
              Bulk Edit Offers
            </h1>
            <Link
              href="/offers"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium shadow-sm bg-white hover:bg-slate-50 transition-colors"
            >
              ← Back to Offers
            </Link>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Offer Selection Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setOfferSelectionExpanded(!offerSelectionExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                Offer Selection
              </h2>
              <span className="text-slate-400">
                {offerSelectionExpanded ? '▼' : '▶'}
              </span>
            </button>

            {offerSelectionExpanded && (
              <div className="px-6 pb-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search in both, available and selected"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white hover:bg-slate-50"
                  >
                    <svg
                      className="w-4 h-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('available')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'available'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('selected')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'selected'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Selected ({selectedIds.size})
                  </button>
                </div>

                <div className="mb-3">
                  {activeTab === 'available' ? (
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Select All
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mr-2"></div>
                      Loading offers...
                    </div>
                  ) : displayedOffers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      {activeTab === 'available'
                        ? 'No available offers found.'
                        : 'No offers selected.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {displayedOffers.map((offer) => (
                        <div
                          key={offer.id}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3"
                          onClick={() => toggleSelection(offer.id)}
                        >
                          <div
                            className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                              selectedIds.has(offer.id)
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-slate-300'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              ({offer.everflow_offer_id}) {offer.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Changes Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Changes
              </h2>
              <button
                type="button"
                onClick={addChange}
                className="text-slate-600 hover:text-slate-900"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Field Type *
                        </label>
                        <select
                          value={change.fieldType}
                          onChange={(e) =>
                            updateChange(change.id, {
                              fieldType: e.target.value as FieldType,
                              value: '',
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        >
                          <option value="">Select Field Type...</option>
                          <option value="visibility">Visibility</option>
                          <option value="brandGuidelinesUrl">
                            Brand Guidelines URL
                          </option>
                          <option value="notes">Brand Guidelines Notes</option>
                        </select>
                      </div>

                      {change.fieldType === 'visibility' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Value *
                          </label>
                          <select
                            value={change.value}
                            onChange={(e) =>
                              updateChange(change.id, { value: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                          >
                            <option value="">Select visibility...</option>
                            <option value="hidden">Hidden</option>
                            <option value="internal">Internal</option>
                            <option value="public">Public</option>
                          </select>
                        </div>
                      )}

                      {change.fieldType === 'brandGuidelinesUrl' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Value *
                          </label>
                          <input
                            type="url"
                            value={change.value}
                            onChange={(e) =>
                              updateChange(change.id, { value: e.target.value })
                            }
                            placeholder="https://example.com/brand-guidelines"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                          />
                        </div>
                      )}

                      {change.fieldType === 'notes' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Value *
                          </label>
                          <textarea
                            value={change.value}
                            onChange={(e) =>
                              updateChange(change.id, { value: e.target.value })
                            }
                            placeholder="Brand Guidelines notes..."
                            rows={3}
                            maxLength={2000}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                          />
                          <div className="mt-1 text-xs text-slate-500">
                            {change.value.length} / 2000 characters
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeChange(change.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <Link
                href="/offers"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={applyChanges}
                disabled={
                  applying ||
                  selectedIds.size === 0 ||
                  changes.filter((c) => c.fieldType && c.value.trim()).length ===
                    0
                }
                className="rounded-full px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {applying ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

