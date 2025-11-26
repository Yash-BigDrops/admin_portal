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
  data?: any
}

type SortOption = 'id_desc' | 'id_asc' | 'name_asc' | 'name_desc'

type Filters = {
  status: string | null
  visibility: 'hidden' | 'internal' | 'public' | null
}

export default function OffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [sort, setSort] = useState<SortOption>('id_desc')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [hoveredFilter, setHoveredFilter] = useState<'status' | 'visibility' | 'sort' | null>(null)
  const [filters, setFilters] = useState<Filters>({
    status: 'active',
    visibility: null,
  })

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Form fields
  const [newOfferId, setNewOfferId] = useState('')
  const [newOfferName, setNewOfferName] = useState('')
  const [newAdvId, setNewAdvId] = useState('')
  const [newAdvName, setNewAdvName] = useState('')
  const [newStatus, setNewStatus] = useState<'active' | 'paused' | 'disabled'>('active')
  const [newVisibility, setNewVisibility] = useState<Offer['visibility']>('hidden')
  const [newBrandUrl, setNewBrandUrl] = useState('')
  const [newNotes, setNewNotes] = useState('')

  async function loadOffers(currentSort: SortOption = sort, currentFilters: Filters = filters) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('sort', currentSort)
      params.set('limit', '1000')
      
      if (currentFilters.status) {
        params.set('status', currentFilters.status)
      }
      
      if (currentFilters.visibility) {
        params.set('visibility', currentFilters.visibility)
      }

      const res = await fetch(`/api/offers?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          console.error('[Offers] Unauthorized - redirecting to sign in')
          router.push('/auth/signin')
          return
        }
        setError(json.error || 'Failed to load offers.')
        return
      }
      setOffers(json.items ?? [])
    } catch (err) {
      console.error('[Offers] Load error:', err)
      setError('Failed to load offers.')
    } finally {
      setLoading(false)
    }
  }

  async function syncOffers() {
    if (syncing) {
      console.warn('[Offers] Sync already in progress, ignoring duplicate request')
      return
    }
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/offers/sync', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (res.status === 429) {
          const retryMsg = json.retryAfter
            ? ` Please try again in ${json.retryAfter}.`
            : ''
          setError(`${json.error || 'Too many sync requests.'}${retryMsg}`)
          return
        }
        setError(json.error || json.details || 'Failed to sync offers.')
      } else {
        setError(null)
        await loadOffers()
      }
    } catch (err) {
      console.error(err)
      setError('Failed to sync offers.')
    } finally {
      setSyncing(false)
    }
  }

  async function updateVisibility(id: string, visibility: Offer['visibility']) {
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        console.error('Failed to update visibility')
        return
      }
      await loadOffers()
    } catch (err) {
      console.error(err)
    }
  }

  async function submitCreateManualOffer() {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: newOfferId,
          name: newOfferName,
          advertiserId: newAdvId || null,
          advertiserName: newAdvName || null,
          status: newStatus,
          visibility: newVisibility,
          brandGuidelinesUrl: newBrandUrl || null,
          notes: newNotes || null,
        }),
        credentials: 'include',
      })

      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (res.status === 409) {
          setCreateError(json.error || 'An offer with that ID already exists.')
          return
        }
        if (res.status === 400) {
          setCreateError(json.error || 'Validation error. Please check your inputs.')
          return
        }
        setCreateError(json.error || json.details || 'Failed to create offer.')
        return
      }

      // Reset form
      setNewOfferId('')
      setNewOfferName('')
      setNewAdvId('')
      setNewAdvName('')
      setNewStatus('active')
      setNewVisibility('hidden')
      setNewBrandUrl('')
      setNewNotes('')
      setShowCreate(false)

      // Reload list so new offer appears
      await loadOffers()
    } catch (err) {
      console.error('[Offers] Create error:', err)
      setCreateError('Failed to create offer.')
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    loadOffers(sort, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, filters])

  function updateFilter(type: 'status' | 'visibility', value: string | null) {
    const newFilters: Filters = { ...filters }
    if (type === 'status') {
      newFilters.status = value
    } else {
      newFilters.visibility = (value as Filters['visibility']) || null
    }
    setFilters(newFilters)
  }

  function clearFilters() {
    const clearedFilters: Filters = {
      status: 'active',
      visibility: null,
    }
    setFilters(clearedFilters)
  }

  const activeFilterCount = 
    (filters.status !== 'active' ? 1 : 0) + 
    (filters.visibility ? 1 : 0)

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <div className="p-6 lg:p-8">
                 <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-6 text-slate-900">
                   Offers
                 </h1>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 sm:px-6 py-4 mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium shadow-sm bg-white hover:bg-slate-50 transition-colors whitespace-nowrap"
                onClick={() => setShowCreate(true)}
              >
                Create New Manually +
              </button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search By Company Name / id / email id / website / platform id"
                  className="w-full sm:w-80 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                />

                <div className="relative">
                  <div
                    className="relative"
                    onMouseEnter={() => setShowFilterDropdown(true)}
                    onMouseLeave={() => {
                      setShowFilterDropdown(false)
                      setHoveredFilter(null)
                    }}
                  >
                    <button
                      type="button"
                      className={`rounded-full border border-slate-300 px-4 py-2 text-xs sm:text-sm bg-white hover:bg-slate-50 transition-colors whitespace-nowrap relative ${
                        activeFilterCount > 0 ? 'border-slate-400 bg-slate-50' : ''
                      }`}
                    >
                      Filter
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-slate-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    {showFilterDropdown && (
                      <div className="absolute right-0 top-full pt-1 w-56 bg-transparent z-50">
                        <div className="bg-white rounded-lg shadow-lg border border-slate-200">
                        <div className="py-2">
                          <div
                            className="relative"
                            onMouseEnter={() => setHoveredFilter('status')}
                            onMouseLeave={() => setHoveredFilter(null)}
                          >
                            <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                              <span>Status</span>
                              <span className="text-xs text-slate-400">→</span>
                            </div>
                            {hoveredFilter === 'status' && (
                              <div 
                                className="absolute left-full top-0 ml-0.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                                onMouseEnter={() => setHoveredFilter('status')}
                                onMouseLeave={() => setHoveredFilter(null)}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      updateFilter('status', null)
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.status === null || !filters.status ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    All Statuses
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateFilter('status', 'active')
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.status === 'active' ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    Active
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateFilter('status', 'inactive')
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.status === 'inactive' ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    Inactive
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateFilter('status', 'pending')
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.status === 'pending' ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    Pending
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div
                            className="relative"
                            onMouseEnter={() => setHoveredFilter('visibility')}
                            onMouseLeave={() => setHoveredFilter(null)}
                          >
                            <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                              <span>Visibility</span>
                              <span className="text-xs text-slate-400">→</span>
                            </div>
                            {hoveredFilter === 'visibility' && (
                              <div 
                                className="absolute left-full top-0 ml-0.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                                onMouseEnter={() => setHoveredFilter('visibility')}
                                onMouseLeave={() => setHoveredFilter(null)}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      updateFilter('visibility', null)
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.visibility === null || !filters.visibility ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    All Visibility
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateFilter('visibility', 'hidden')
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.visibility === 'hidden' ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    Hidden
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateFilter('visibility', 'internal')
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.visibility === 'internal' ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    Internal
                                  </button>
                                  <button
                                    onClick={() => {
                                      updateFilter('visibility', 'public')
                                      setShowFilterDropdown(false)
                                      setHoveredFilter(null)
                                    }}
                                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                      filters.visibility === 'public' ? 'bg-slate-100' : ''
                                    }`}
                                  >
                                    Public
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div
                            className="relative"
                            onMouseEnter={() => setHoveredFilter('sort')}
                            onMouseLeave={() => setHoveredFilter(null)}
                          >
                            <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                              <span>Sort By</span>
                              <span className="text-xs text-slate-400">→</span>
                            </div>
                            {hoveredFilter === 'sort' && (
                              <div 
                                className="absolute left-full top-0 ml-0.5 w-52 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
                                onMouseEnter={() => setHoveredFilter('sort')}
                                onMouseLeave={() => setHoveredFilter(null)}
                              >
                                <div className="py-1">
                                         <button
                                           onClick={() => {
                                             setSort('id_desc')
                                             setShowFilterDropdown(false)
                                             setHoveredFilter(null)
                                           }}
                                           className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                             sort === 'id_desc' ? 'bg-slate-100' : ''
                                           }`}
                                         >
                                           New to Old
                                         </button>
                                         <button
                                           onClick={() => {
                                             setSort('id_asc')
                                             setShowFilterDropdown(false)
                                             setHoveredFilter(null)
                                           }}
                                           className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                                             sort === 'id_asc' ? 'bg-slate-100' : ''
                                           }`}
                                         >
                                           Old to New
                                         </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {activeFilterCount > 0 && (
                            <div className="border-t border-slate-200 mt-1 pt-1">
                              <button
                                onClick={() => {
                                  clearFilters()
                                  setShowFilterDropdown(false)
                                  setHoveredFilter(null)
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Clear Filters
                              </button>
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/offers/bulk-edit"
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs sm:text-sm bg-white hover:bg-slate-50 transition-colors whitespace-nowrap inline-block text-center"
                >
                  Bulk Edit
                </Link>
                <button
                  type="button"
                  onClick={syncOffers}
                  disabled={syncing}
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs sm:text-sm bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {syncing ? 'Syncing...' : 'Sync from Everflow'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center text-sm text-slate-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mr-2"></div>
              Loading offers…
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center text-sm text-slate-500">
              {offers.length === 0
                ? 'No offers found. Try syncing from Everflow.'
                : 'No offers match your search.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  onChangeVisibility={updateVisibility}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Offer Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creating) {
              setShowCreate(false)
              setCreateError(null)
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Create Offer Manually</h2>

            {createError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {createError}
              </div>
            )}

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Offer ID *
                  </label>
                  <input
                    value={newOfferId}
                    onChange={(e) => setNewOfferId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    placeholder="e.g. 3001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as 'active' | 'paused' | 'disabled')
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Offer Name *
                </label>
                <input
                  value={newOfferName}
                  onChange={(e) => setNewOfferName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  placeholder="Offer Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Advertiser ID
                  </label>
                  <input
                    value={newAdvId}
                    onChange={(e) => setNewAdvId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    placeholder="e.g. 21"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Advertiser Name
                  </label>
                  <input
                    value={newAdvName}
                    onChange={(e) => setNewAdvName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    placeholder="ADV NAME 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Visibility
                </label>
                <select
                  value={newVisibility}
                  onChange={(e) =>
                    setNewVisibility(e.target.value as Offer['visibility'])
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                >
                  <option value="hidden">Hidden</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Brand Guidelines URL
                </label>
                <input
                  value={newBrandUrl}
                  onChange={(e) => setNewBrandUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  placeholder="https://…"
                />
              </div>

              <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Brand Guidelines Notes
                  </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  rows={3}
                  maxLength={2000}
                />
                <div className="mt-1 text-xs text-slate-500">
                  {newNotes.length} / 2000 characters
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!creating) {
                    setShowCreate(false)
                    setCreateError(null)
                  }
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCreateManualOffer}
                disabled={creating || !newOfferId.trim() || !newOfferName.trim()}
                className="rounded-full px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating…' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type OfferRowProps = {
  offer: Offer
  onChangeVisibility: (id: string, visibility: Offer['visibility']) => void
}

function OfferRow({ offer, onChangeVisibility }: OfferRowProps) {
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)

  const source =
    (offer.data as any)?.created_source ||
    (offer.data as any)?.source ||
    null

  const isManual = source === 'manual'

  const createdLabel = isManual ? 'Manually' : 'API'

  const statusColor =
    offer.status === 'active'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-600'

  const visibilityLabel =
    offer.visibility === 'public'
      ? 'Public'
      : offer.visibility === 'internal'
        ? 'Internal'
        : 'Hidden'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 sm:px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">Offer ID:</span>{' '}
            <span>{offer.everflow_offer_id}</span>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Offer Name:</span>{' '}
            <span className="font-semibold text-slate-900">{offer.name}</span>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Adv ID:</span>{' '}
            <span>({offer.advertiser_id || '-'})</span>
            {' : '}
            <span className="font-medium">Adv Name:</span>{' '}
            <span>{offer.advertiser_name || '-'}</span>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Created Via:</span>{' '}
            <span>{createdLabel}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="flex gap-2">
            <Link
              href={`/offers/${offer.id}`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors whitespace-nowrap inline-block text-center"
            >
              Edit Details
            </Link>
            <Link
              href={`/offers/${offer.id}#brand-guidelines`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors whitespace-nowrap inline-block text-center"
            >
              Brand Guidelines
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${statusColor}`}
              title="Everflow Status"
            >
              {offer.status}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 transition-colors"
              >
                <span>{visibilityLabel}</span>
                <span className="text-xs">↓</span>
              </button>

              {showVisibilityDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVisibilityDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onChangeVisibility(offer.id, 'hidden')
                          setShowVisibilityDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                          offer.visibility === 'hidden' ? 'bg-slate-100' : ''
                        }`}
                      >
                        Hidden
                      </button>
                      <button
                        onClick={() => {
                          onChangeVisibility(offer.id, 'internal')
                          setShowVisibilityDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                          offer.visibility === 'internal' ? 'bg-slate-100' : ''
                        }`}
                      >
                        Internal
                      </button>
                      <button
                        onClick={() => {
                          onChangeVisibility(offer.id, 'public')
                          setShowVisibilityDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 ${
                          offer.visibility === 'public' ? 'bg-slate-100' : ''
                        }`}
                      >
                        Public
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
