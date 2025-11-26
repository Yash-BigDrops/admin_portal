'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Credential = {
  id: string
  platform: string
  account_name: string
  created_by: string
  created_at: string
  updated_at: string
}

export default function CredentialsPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    platform: '',
    account_name: '',
    api_key: '',
    secret: '',
  })

  async function loadCredentials() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/credentials', {
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to load credentials')
      }
      const json = await res.json()
      setCredentials(json.credentials ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  async function createCredential() {
    setError(null)
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: formData.platform,
          account_name: formData.account_name,
          api_key: formData.api_key,
          secret: formData.secret || undefined,
        }),
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.details || 'Failed to create credential')
      }
      setShowModal(false)
      setFormData({ platform: '', account_name: '', api_key: '', secret: '' })
      await loadCredentials()
    } catch (err: any) {
      setError(err.message || 'Failed to create credential')
    }
  }

  async function deleteCredential(id: string) {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return
    }

    setError(null)
    try {
      const res = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to delete credential')
      }
      await loadCredentials()
    } catch (err: any) {
      setError(err.message || 'Failed to delete credential')
    }
  }

  useEffect(() => {
    loadCredentials()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Integration Credentials</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 border rounded text-sm bg-black text-white hover:bg-gray-800"
        >
          Add Credential
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : credentials.length === 0 ? (
        <p className="text-gray-500">
          No credentials found. Click "Add Credential" to get started.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2 border">Platform</th>
              <th className="text-left p-2 border">Account Name</th>
              <th className="text-left p-2 border">Created By</th>
              <th className="text-left p-2 border">Created At</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((cred) => (
              <tr key={cred.id} className="border-t hover:bg-gray-50">
                <td className="p-2 border font-mono text-xs">{cred.platform}</td>
                <td className="p-2 border">{cred.account_name}</td>
                <td className="p-2 border">{cred.created_by}</td>
                <td className="p-2 border text-xs">
                  {new Date(cred.created_at).toLocaleString()}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => deleteCredential(cred.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Credential</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  placeholder="everflow, cj, shareasale, etc."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_name: e.target.value })
                  }
                  placeholder="Main account, Test account, etc."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  API Key *
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) =>
                    setFormData({ ...formData, api_key: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Secret (optional)
                </label>
                <input
                  type="password"
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData({ ...formData, secret: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={createCredential}
                className="flex-1 px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormData({
                    platform: '',
                    account_name: '',
                    api_key: '',
                    secret: '',
                  })
                }}
                className="flex-1 px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

