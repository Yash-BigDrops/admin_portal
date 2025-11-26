'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  geo_targets: string[] | null
  data: any
  created_at: string
  updated_at: string
}

export default function OfferDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const offerId = params.id as string

  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [visibility, setVisibility] = useState<'hidden' | 'internal' | 'public'>('hidden')
  const [brandGuidelinesUrl, setBrandGuidelinesUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [advertiserId, setAdvertiserId] = useState('')
  const [advertiserName, setAdvertiserName] = useState('')

  useEffect(() => {
    async function loadOffer() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/offers/${offerId}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const json = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/signin')
            return
          }
          if (res.status === 404) {
            setError('Offer not found')
            return
          }
          setError(json.error || 'Failed to load offer')
          return
        }

        const offerData = json as Offer
        setOffer(offerData)
        setVisibility(offerData.visibility)
        setBrandGuidelinesUrl(offerData.data?.brand_guidelines_url || '')
        setNotes(offerData.data?.notes || '')
        setAdvertiserId(offerData.advertiser_id || '')
        setAdvertiserName(offerData.advertiser_name || '')
      } catch (err) {
        console.error('[OfferDetails] Load error:', err)
        setError('Failed to load offer')
      } finally {
        setLoading(false)
      }
    }

    if (offerId) {
      loadOffer()
    }
  }, [offerId, router])

  async function handleSave() {
    if (!offer) return

    setSaving(true)
    setError(null)

    const isManualOffer =
      offer.data?.source === 'manual' || offer.data?.created_source === 'manual'

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility,
          brandGuidelinesUrl: brandGuidelinesUrl || null,
          notes: notes || null,
          // Only send advertiser fields if it's a manual offer
          ...(isManualOffer && {
            advertiserId: advertiserId || null,
            advertiserName: advertiserName || null,
          }),
        }),
        credentials: 'include',
      })

      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        if (res.status === 400) {
          setError(json.error || 'Validation error')
          return
        }
        setError(json.error || json.details || 'Failed to update offer')
        return
      }

      // Update local state with response
      if (json.offer) {
        setOffer(json.offer)
        setBrandGuidelinesUrl(json.offer.data?.brand_guidelines_url || '')
        setNotes(json.offer.data?.notes || '')
        setAdvertiserId(json.offer.advertiser_id || '')
        setAdvertiserName(json.offer.advertiser_name || '')
      }

      // Show success (could use a toast here)
      alert('Offer updated successfully!')
    } catch (err) {
      console.error('[OfferDetails] Save error:', err)
      setError('Failed to update offer')
    } finally {
      setSaving(false)
    }
  }

  const isManual = offer?.data?.source === 'manual' || offer?.data?.created_source === 'manual'

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center text-sm text-slate-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mr-2"></div>
            Loading offer details...
          </div>
        </main>
      </div>
    )
  }

  if (error && !offer) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-8">
            <div className="mb-4 text-red-700">{error}</div>
            <Link
              href="/offers"
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              ← Back to Offers
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!offer) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <Link
              href="/offers"
              className="text-sm text-slate-600 hover:text-slate-900 underline mb-4 inline-block"
            >
              ← Back to Offers
            </Link>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
              Offer Details
            </h1>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-6 relative">
            {/* Read-only Everflow Fields */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Everflow Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Offer ID
                  </label>
                  <div className="text-sm text-slate-900">{offer.everflow_offer_id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Offer Name
                  </label>
                  <div className="text-sm text-slate-900 font-semibold">{offer.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status (Everflow)
                  </label>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      offer.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Source
                  </label>
                  <div className="text-sm text-slate-900">
                    {isManual ? 'Manually Created' : 'API (Everflow)'}
                  </div>
                </div>
                {offer.geo_targets && offer.geo_targets.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Geo Targets
                    </label>
                    <div className="text-sm text-slate-900">
                      {offer.geo_targets.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Fields */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Editable Fields</h2>
              <div className="space-y-6">
                {/* Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="visibility"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Visibility
                    </label>
                    <select
                      id="visibility"
                      value={visibility}
                      onChange={(e) =>
                        setVisibility(e.target.value as 'hidden' | 'internal' | 'public')
                      }
                      className="w-full md:w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    >
                      <option value="hidden">Hidden</option>
                      <option value="internal">Internal</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <a
                      href="#"
                      className="text-md text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Pending Requests
                    </a>
                  </div>
                </div>

                {/* Advertiser Fields (editable for manual offers only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="advertiserId"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Advertiser ID
                      {!isManual && (
                        <span className="ml-2 text-xs text-slate-500 font-normal">
                          (Read-only from Everflow)
                        </span>
                      )}
                    </label>
                    <input
                      id="advertiserId"
                      type="text"
                      value={advertiserId}
                      onChange={(e) => setAdvertiserId(e.target.value)}
                      disabled={!isManual}
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${
                        !isManual
                          ? 'bg-slate-50 text-slate-500 cursor-not-allowed'
                          : ''
                      }`}
                      placeholder="Advertiser ID"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="advertiserName"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Advertiser Name
                      {!isManual && (
                        <span className="ml-2 text-xs text-slate-500 font-normal">
                          (Read-only from Everflow)
                        </span>
                      )}
                    </label>
                    <input
                      id="advertiserName"
                      type="text"
                      value={advertiserName}
                      onChange={(e) => setAdvertiserName(e.target.value)}
                      disabled={!isManual}
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 ${
                        !isManual
                          ? 'bg-slate-50 text-slate-500 cursor-not-allowed'
                          : ''
                      }`}
                      placeholder="Advertiser Name"
                    />
                  </div>
                </div>

                {/* Brand Guidelines URL */}
                <div id="brand-guidelines">
                  <label
                    htmlFor="brandGuidelinesUrl"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Brand Guidelines URL
                  </label>
                  <input
                    id="brandGuidelinesUrl"
                    type="url"
                    value={brandGuidelinesUrl}
                    onChange={(e) => setBrandGuidelinesUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    placeholder="https://example.com/brand-guidelines"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Brand Guidelines Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    placeholder="Brand Guidelines notes about this offer..."
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    {notes.length} / 2000 characters
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/offers"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium bg-white hover:bg-slate-50 transition-colors inline-block"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

