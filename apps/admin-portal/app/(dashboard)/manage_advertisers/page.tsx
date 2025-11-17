'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Button } from '@repo/ui'
import { Input } from '@repo/ui'
import { Badge } from '@repo/ui'
import { 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  Edit,
  UserCog,
  X
} from 'lucide-react'
import { AdvertisersTable } from '@/components/advertisers/AdvertisersTable'
import { CreateAdvertiserDialog } from '@/components/advertisers/CreateAdvertiserDialog'
import { PullViaAPIDialog } from '@/components/advertisers/PullViaAPIDialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export default function ManageAdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPullAPIDialog, setShowPullAPIDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    setMounted(true)
    fetchAdvertisers()
  }, [])

  const fetchAdvertisers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/advertisers')
      if (response.ok) {
        const data = await response.json()
        setAdvertisers(data.advertisers || [])
      }
    } catch (error) {
      console.error('Error fetching advertisers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAdvertisers = advertisers.filter((advertiser) => {
    const matchesSearch = 
      !searchQuery ||
      advertiser.advertiserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advertiser.id?.toString().includes(searchQuery) ||
      advertiser.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advertiser.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advertiser.platformId?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      advertiser.status === filterStatus ||
      (filterStatus === 'manual' && advertiser.createdVia === 'manual') ||
      (filterStatus === 'api' && advertiser.createdVia === 'api')

    return matchesSearch && matchesFilter
  })

  // Prevent hydration mismatch by not rendering dynamic content until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Manage Advertisers</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage advertiser accounts and settings.
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Top Row: Create/Import Buttons and Search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Manually
                </Button>
                <Button variant="outline" onClick={() => setShowPullAPIDialog(true)}>
                  Pull Via API
                </Button>
              </div>
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search By Company Name / id / email id / website / platform id"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Bottom Row: Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    All Advertisers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('suspended')}>
                    Suspended
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('manual')}>
                    Created Manually
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('api')}>
                    Created Via API
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Applied Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                    <span>Search: "{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove search filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                    <span>
                      {filterStatus === 'active' && 'Status: Active'}
                      {filterStatus === 'inactive' && 'Status: Inactive'}
                      {filterStatus === 'suspended' && 'Status: Suspended'}
                      {filterStatus === 'manual' && 'Created: Manually'}
                      {filterStatus === 'api' && 'Created: Via API'}
                    </span>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                      aria-label="Remove status filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertisers Table */}
      <AdvertisersTable 
        advertisers={filteredAdvertisers}
        loading={loading}
        onRefresh={fetchAdvertisers}
      />

      {/* Dialogs */}
      <CreateAdvertiserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchAdvertisers}
      />
      <PullViaAPIDialog
        open={showPullAPIDialog}
        onOpenChange={setShowPullAPIDialog}
        onSuccess={fetchAdvertisers}
      />
    </div>
  )
}

