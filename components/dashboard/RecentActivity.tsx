'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'approval',
    user: 'John Smith',
    action: 'approved',
    target: 'Creative Request #1234',
    time: '2 minutes ago',
    status: 'success'
  },
  {
    id: 2,
    type: 'rejection',
    user: 'Sarah Johnson',
    action: 'rejected',
    target: 'Publisher Application #5678',
    time: '15 minutes ago',
    status: 'error'
  },
  {
    id: 3,
    type: 'new_request',
    user: 'Mike Wilson',
    action: 'submitted',
    target: 'New Creative Request #1235',
    time: '1 hour ago',
    status: 'info'
  },
  {
    id: 4,
    type: 'approval',
    user: 'Lisa Brown',
    action: 'approved',
    target: 'Offer Assignment #9012',
    time: '2 hours ago',
    status: 'success'
  },
  {
    id: 5,
    type: 'warning',
    user: 'System',
    action: 'flagged',
    target: 'Suspicious Activity Detected',
    time: '3 hours ago',
    status: 'warning'
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'approval':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'rejection':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'new_request':
      return <User className="h-4 w-4 text-blue-500" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
    case 'error':
      return <Badge variant="destructive">Error</Badge>
    case 'warning':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>
    case 'info':
      return <Badge variant="outline" className="border-blue-500 text-blue-700">Info</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.user} {activity.action} {activity.target}
                  </p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
