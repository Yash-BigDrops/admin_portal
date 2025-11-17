'use client'

import { useState, useEffect } from 'react'
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

interface Advertiser {
  id: string
  advertiserName: string
  advPlatform: string
  createdVia: 'manual' | 'api'
  apiAdvId?: string
  status: 'active' | 'inactive' | 'suspended'
  companyName?: string
  email?: string
  website?: string
  platformId?: string
  platformAffiliateId?: string
  apiKey?: string
  platformUrl?: string
}

interface EditAdvertiserDialogProps {
  advertiser: Advertiser
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditAdvertiserDialog({
  advertiser,
  open,
  onOpenChange,
  onSuccess,
}: EditAdvertiserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    advertiserId: '',
    platformType: '',
    platformAffiliateId: '',
    apiKey: '',
    platformUrl: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
  })

  useEffect(() => {
    if (advertiser) {
      setFormData({
        companyName: advertiser.companyName || '',
        advertiserId: advertiser.platformId || '',
        platformType: advertiser.advPlatform || '',
        platformAffiliateId: advertiser.platformAffiliateId || '',
        apiKey: advertiser.apiKey || '',
        platformUrl: advertiser.platformUrl || '',
        status: advertiser.status || 'active',
      })
    }
  }, [advertiser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/advertisers/${advertiser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update advertiser')
      }
    } catch (error) {
      console.error('Error updating advertiser:', error)
      alert('Failed to update advertiser')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Advertiser Details</DialogTitle>
          <DialogDescription>
            Update advertiser information below.
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
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'suspended') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? 'Updating...' : 'Update Advertiser'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

