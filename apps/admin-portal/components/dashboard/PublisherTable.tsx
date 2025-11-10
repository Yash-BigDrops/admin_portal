'use client'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@repo/ui'
import { Button } from '@repo/ui'
import { DataTable } from '@/components/data-table/DataTable'
import { Eye, Edit, Trash2, AlertCircle } from 'lucide-react'
import { usePublishers } from '@/lib/hooks/useEverflowData'
import Link from 'next/link'

interface Publisher {
  id: string
  name: string
  email: string
  company: string
  status: 'active' | 'pending' | 'suspended'
  revenue: number
  lastActive: string
  offers: number
}

interface RawPublisher {
  publisher_id?: string | number
  id?: string | number
  publisher_name?: string
  name?: string
  email?: string
  contact_email?: string
  company_name?: string
  company?: string
  status?: string
  revenue?: number
  total_revenue?: number
  last_active?: string
  last_activity?: string
  active_offers?: number
  offers_count?: number
}

const transformPublisherData = (publishers: RawPublisher[]): Publisher[] => {
  return publishers.map((publisher: RawPublisher) => ({
    id: publisher.publisher_id?.toString() || publisher.id?.toString() || Math.random().toString(),
    name: publisher.publisher_name || publisher.name || 'Unknown Publisher',
    email: publisher.email || publisher.contact_email || 'No email',
    company: publisher.company_name || publisher.company || 'No company',
    status: publisher.status === 'active' ? 'active' : publisher.status === 'pending' ? 'pending' : 'suspended',
    revenue: publisher.revenue || publisher.total_revenue || 0,
    lastActive: publisher.last_active || publisher.last_activity || new Date().toISOString().split('T')[0],
    offers: publisher.active_offers || publisher.offers_count || 0
  }))
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    case 'pending':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>
    case 'suspended':
      return <Badge variant="destructive">Suspended</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

const columns: ColumnDef<Publisher>[] = [
  {
    accessorKey: 'name',
    header: 'Publisher',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('name')}</div>
        <div className="text-sm text-gray-500">{row.getValue('email')}</div>
      </div>
    ),
  },
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    cell: ({ row }) => {
      const revenue = row.getValue('revenue') as number
      return <div className="font-medium">${revenue.toLocaleString()}</div>
    },
  },
  {
    accessorKey: 'offers',
    header: 'Active Offers',
    cell: ({ row }) => {
      const offers = row.getValue('offers') as number
      return <div className="text-center">{offers}</div>
    },
  },
  {
    accessorKey: 'lastActive',
    header: 'Last Active',
    cell: ({ row }) => {
      const date = new Date(row.getValue('lastActive'))
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Link href={`/publishers/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

export default function PublisherTable() {
  const { publishers, error, isLoading } = usePublishers()

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Publishers</h3>
          <Button>Add Publisher</Button>
        </div>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load publishers data</p>
          </div>
        </div>
      </div>
    )
  }

  const transformedData = transformPublisherData(publishers)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Publishers</h3>
        <Button>Add Publisher</Button>
      </div>
      <DataTable 
        columns={columns} 
        data={isLoading ? [] : transformedData} 
        searchKey="name"
        searchPlaceholder="Search publishers..."
      />
      {isLoading && (
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading publishers...</p>
          </div>
        </div>
      )}
    </div>
  )
}
