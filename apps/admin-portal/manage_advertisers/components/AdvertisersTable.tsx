'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Button } from '@repo/ui'
import { Badge } from '@repo/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui'
import { Edit, UserCog, ChevronDown, RefreshCw } from 'lucide-react'
import { EditAdvertiserDialog } from './EditAdvertiserDialog'

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

interface AdvertisersTableProps {
  advertisers: Advertiser[]
  loading: boolean
  onRefresh: () => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-green-600'
    case 'inactive':
      return 'text-gray-600'
    case 'suspended':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function AdvertisersTable({ advertisers, loading, onRefresh }: AdvertisersTableProps) {
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const handleStatusChange = async (advertiserId: string, newStatus: string) => {
    setUpdatingStatus(advertiserId)
    try {
      const response = await fetch(`/api/advertisers/${advertiserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleImpersonate = async (advertiserId: string) => {
    // TODO: Implement impersonate functionality
    console.log('Impersonate advertiser:', advertiserId)
    alert('Impersonate functionality coming soon')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Advertisers</CardTitle>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {advertisers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No advertisers found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Advertiser Name</TableHead>
                    <TableHead>Adv Platform</TableHead>
                    <TableHead>Created Manually / via API</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advertisers.map((advertiser) => (
                    <TableRow key={advertiser.id}>
                      <TableCell className="font-medium">{advertiser.id}</TableCell>
                      <TableCell>{advertiser.advertiserName}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          Adv Platform : {advertiser.advPlatform}
                        </span>
                      </TableCell>
                      <TableCell>
                        {advertiser.createdVia === 'manual' ? (
                          <Badge variant="outline">Manually</Badge>
                        ) : (
                          <Badge variant="outline">
                            API (adv id : {advertiser.apiAdvId || 'N/A'})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAdvertiser(advertiser)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImpersonate(advertiser.id)}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Impersonate
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingStatus === advertiser.id}
                                className={`${getStatusColor(advertiser.status)} border-0 hover:bg-transparent`}
                              >
                                <span className={advertiser.status === 'active' ? 'text-green-600 font-medium' : ''}>
                                  {advertiser.status === 'active' ? 'Active' : 
                                   advertiser.status === 'inactive' ? 'Inactive' : 
                                   'Suspended'}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(advertiser.id, 'active')}
                              >
                                Active
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(advertiser.id, 'inactive')}
                              >
                                Inactive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(advertiser.id, 'suspended')}
                              >
                                Suspended
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingAdvertiser && (
        <EditAdvertiserDialog
          advertiser={editingAdvertiser}
          open={!!editingAdvertiser}
          onOpenChange={(open) => !open && setEditingAdvertiser(null)}
          onSuccess={() => {
            setEditingAdvertiser(null)
            onRefresh()
          }}
        />
      )}
    </>
  )
}

