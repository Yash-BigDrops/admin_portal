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
    advertiserName: '',
    companyName: '',
    email: '',
    website: '',
    advPlatform: '',
    platformId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/advertisers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdVia: 'manual',
          status: 'active',
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          advertiserName: '',
          companyName: '',
          email: '',
          website: '',
          advPlatform: '',
          platformId: '',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create advertiser')
      }
    } catch (error) {
      console.error('Error creating advertiser:', error)
      alert('Failed to create advertiser')
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
              {loading ? 'Creating...' : 'Create Advertiser'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

