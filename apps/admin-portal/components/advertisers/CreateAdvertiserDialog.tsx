'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Label } from '@repo/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui'

interface CreateAdvertiserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAdvertiserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAdvertiserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    advertiserId: '',
    platformType: '',
    platformAffiliateId: '',
    apiKey: '',
    platformUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('[CreateAdvertiser] Submitting:', { ...formData, createdVia: 'manual', status: 'active' })
      const response = await fetch('/api/advertisers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdVia: 'manual',
          status: 'active',
        }),
      })
      console.log('[CreateAdvertiser] Response status:', response.status, response.statusText)
      console.log('[CreateAdvertiser] Response URL:', response.url)

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          companyName: '',
          advertiserId: '',
          platformType: '',
          platformAffiliateId: '',
          apiKey: '',
          platformUrl: '',
        })
      } else {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          alert(error.error || 'Failed to create advertiser')
        } else {
          // Response is HTML (error page), get text instead
          const text = await response.text()
          console.error('Non-JSON error response:', text)
          alert(`Failed to create advertiser. Status: ${response.status}`)
        }
      }
    } catch (error) {
      console.error('Error creating advertiser:', error)
      alert('Failed to create advertiser. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Advertiser</DialogTitle>
          <DialogDescription>
            Add a new advertiser manually. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="advertiserId">
                Advertiser id in {formData.companyName || '[Company Name]'} platform *
              </Label>
              <Input
                id="advertiserId"
                value={formData.advertiserId}
                onChange={(e) =>
                  setFormData({ ...formData, advertiserId: e.target.value })
                }
                placeholder={`Enter advertiser ID in ${formData.companyName || 'platform'}`}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platformType">Platform Type (Cake / Hasoffers / Hitpath / Everflow) *</Label>
              <Select
                value={formData.platformType}
                onValueChange={(value) =>
                  setFormData({ ...formData, platformType: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cake">Cake</SelectItem>
                  <SelectItem value="Hasoffers">Hasoffers</SelectItem>
                  <SelectItem value="Hitpath">Hitpath</SelectItem>
                  <SelectItem value="Everflow">Everflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platformAffiliateId">Platform Affiliate ID</Label>
              <Input
                id="platformAffiliateId"
                value={formData.platformAffiliateId}
                onChange={(e) =>
                  setFormData({ ...formData, platformAffiliateId: e.target.value })
                }
                placeholder="Enter platform affiliate ID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="Enter API key"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platformUrl">Platform URL</Label>
              <Input
                id="platformUrl"
                type="url"
                value={formData.platformUrl}
                onChange={(e) =>
                  setFormData({ ...formData, platformUrl: e.target.value })
                }
                placeholder="https://platform.example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Save and Continue ->'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

