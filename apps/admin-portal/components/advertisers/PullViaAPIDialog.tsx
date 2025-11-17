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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')

  const checkAPIConnection = async (selectedPlatform: string) => {
    if (selectedPlatform.toLowerCase() === 'everflow') {
      setConnectionStatus('checking')
      try {
        console.log('[Pull Dialog] Starting API connection check...')
        const response = await fetch('/api/everflow/advertisers?limit=1', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        })
        
        console.log('[Pull Dialog] Response status:', response.status)
        console.log('[Pull Dialog] Response ok:', response.ok)
        console.log('[Pull Dialog] Response headers:', Object.fromEntries(response.headers.entries()))
        
        // Read response body once
        const responseText = await response.text()
        console.log('[Pull Dialog] Response text (first 500 chars):', responseText.substring(0, 500))
        
        let responseData: any = null
        try {
          responseData = responseText ? JSON.parse(responseText) : null
          console.log('[Pull Dialog] Parsed response data:', responseData)
        } catch (parseError) {
          console.warn('[Pull Dialog] Failed to parse response as JSON:', parseError)
          responseData = { raw: responseText }
        }
        
        if (response.ok) {
          // If response is OK (200), connection is working
          // Check for specific API key errors in the response
          if (responseData?.error) {
            if (responseData.error.includes('API key') || responseData.error.includes('not configured')) {
              setConnectionStatus('error')
              console.warn('[Pull Dialog] ❌ Everflow API key not configured:', responseData.error)
            } else {
              // Other error but connection is working
              setConnectionStatus('connected')
              console.log('[Pull Dialog] ✅ API connected (has error but connection works):', responseData.error)
            }
          } else {
            // No error - connection is good
            setConnectionStatus('connected')
            console.log('[Pull Dialog] ✅ Everflow API connection verified successfully')
            console.log('[Pull Dialog] Response data:', {
              hasData: !!responseData?.data,
              hasAdvertisers: !!responseData?.advertisers,
              isArray: Array.isArray(responseData),
              total: responseData?.total || responseData?.paging?.total || 0
            })
          }
        } else {
          // Response is not OK - use already read responseData
          console.error('[Pull Dialog] ❌ Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            errorData: responseData
          })
          
          if (response.status === 401) {
            setConnectionStatus('error')
            console.warn('[Pull Dialog] ❌ Authentication failed - not logged in')
            console.warn('[Pull Dialog] Error details:', responseData)
          } else if (response.status === 403) {
            setConnectionStatus('error')
            console.warn('[Pull Dialog] ❌ Permission denied - insufficient permissions')
            console.warn('[Pull Dialog] Error details:', responseData)
          } else if (response.status === 500) {
            setConnectionStatus('error')
            console.warn('[Pull Dialog] ❌ Server error - check terminal logs')
            console.warn('[Pull Dialog] Error details:', responseData)
          } else if (responseData?.error?.includes('API key') || responseData?.error?.includes('not configured')) {
            setConnectionStatus('error')
            console.warn('[Pull Dialog] ❌ Everflow API key not configured')
          } else {
            setConnectionStatus('error')
            console.warn('[Pull Dialog] ❌ Everflow API connection check failed:', {
              status: response.status,
              statusText: response.statusText,
              error: responseData?.error || responseData?.message || responseData?.raw || 'Unknown error'
            })
          }
        }
      } catch (error: any) {
        setConnectionStatus('error')
        console.error('[Pull Dialog] ❌ Network error checking API connection:', {
          message: error.message,
          stack: error.stack
        })
      }
    } else {
      setConnectionStatus('idle')
    }
  }

  const handlePlatformChange = (value: string) => {
    setPlatform(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!platform || !apiAdvId) {
      alert('Please select a platform and enter an advertiser ID')
      return
    }

    setLoading(true)

    try {
      console.log('[Pull Dialog] Submitting request:', { platform, apiAdvId })
      const response = await fetch('/api/advertisers/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          platform,
          apiAdvId,
        }),
      })

      console.log('[Pull Dialog] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Pull Dialog] Success:', data)
        onSuccess()
        onOpenChange(false)
        setPlatform('')
        setApiAdvId('')
        setConnectionStatus('idle')
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.message || 'Failed to pull advertiser from API'
        console.error('[Pull Dialog] Error response:', errorData)
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('[Pull Dialog] Network error:', error)
      alert(`Failed to pull advertiser: ${error.message || 'Network error'}`)
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
              <Select value={platform} onValueChange={handlePlatformChange} required>
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

