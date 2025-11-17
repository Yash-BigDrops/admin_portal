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

interface PullViaAPIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PullViaAPIDialog({
  open,
  onOpenChange,
  onSuccess,
}: PullViaAPIDialogProps) {
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState('')
  const [apiAdvId, setApiAdvId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/advertisers/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          apiAdvId,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setPlatform('')
        setApiAdvId('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to pull advertiser from API')
      }
    } catch (error) {
      console.error('Error pulling advertiser:', error)
      alert('Failed to pull advertiser from API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Pull Advertiser Via API</DialogTitle>
          <DialogDescription>
            Import an advertiser from an external platform API.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select value={platform} onValueChange={setPlatform} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cake">Cake</SelectItem>
                  <SelectItem value="Everflow">Everflow</SelectItem>
                  <SelectItem value="HasOffers">HasOffers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiAdvId">Advertiser ID (from platform) *</Label>
              <Input
                id="apiAdvId"
                value={apiAdvId}
                onChange={(e) => setApiAdvId(e.target.value)}
                placeholder="Enter advertiser ID from platform"
                required
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
              {loading ? 'Pulling...' : 'Pull Advertiser'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

