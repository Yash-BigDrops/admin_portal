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
    advertiserName: '',
    companyName: '',
    email: '',
    website: '',
    advPlatform: '',
    platformId: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
  })

  useEffect(() => {
    if (advertiser) {
      setFormData({
        advertiserName: advertiser.advertiserName || '',
        companyName: advertiser.companyName || '',
        email: advertiser.email || '',
        website: advertiser.website || '',
        advPlatform: advertiser.advPlatform || '',
        platformId: advertiser.platformId || '',
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
              <Label htmlFor="advertiserName">Advertiser Name *</Label>
              <Input
                id="advertiserName"
                value={formData.advertiserName}
                onChange={(e) =>
                  setFormData({ ...formData, advertiserName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="advPlatform">Advertiser Platform *</Label>
              <Select
                value={formData.advPlatform}
                onValueChange={(value) =>
                  setFormData({ ...formData, advPlatform: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cake">Cake</SelectItem>
                  <SelectItem value="Everflow">Everflow</SelectItem>
                  <SelectItem value="HasOffers">HasOffers</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platformId">Platform ID</Label>
              <Input
                id="platformId"
                value={formData.platformId}
                onChange={(e) =>
                  setFormData({ ...formData, platformId: e.target.value })
                }
                placeholder="Platform-specific ID"
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

