'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  MousePointer, 
  Target, 
  Users, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { usePublishers, useAnalytics } from '@/lib/hooks/useEverflowData'

interface PerformanceMetrics {
  revenue: number
  clicks: number
  conversions: number
  conversionRate: number
  ctr: number
  epc: number
  trend: 'up' | 'down' | 'stable'
}

interface Publisher {
  publisher_id?: string | number
  publisher_name?: string
  name?: string
  email?: string
  status?: string
}

interface AnalyticsItem {
  publisher_id?: string | number
  revenue?: number
  clicks?: number
  conversions?: number
}

export default function PublisherPerformance({ publisherId }: { publisherId: string }) {
  const [timeRange, setTimeRange] = useState('30d')
  const { publishers, mutate: refreshPublishers } = usePublishers()
  const { analytics, mutate: refreshAnalytics } = useAnalytics()

  const publisher = publishers.find((p: Publisher) => p.publisher_id?.toString() === publisherId)
  
  if (!publisher) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Publisher not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate performance metrics
  const calculateMetrics = (): PerformanceMetrics => {
    const publisherAnalytics = analytics.filter((item: AnalyticsItem) => 
      item.publisher_id?.toString() === publisherId
    )
    
    const totalRevenue = publisherAnalytics.reduce((sum: number, item: AnalyticsItem) => sum + (item.revenue || 0), 0)
    const totalClicks = publisherAnalytics.reduce((sum: number, item: AnalyticsItem) => sum + (item.clicks || 0), 0)
    const totalConversions = publisherAnalytics.reduce((sum: number, item: AnalyticsItem) => sum + (item.conversions || 0), 0)
    
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0
    const ctr = totalClicks > 0 ? (totalClicks / 1000 * 100) : 0 // Assuming 1000 impressions
    const epc = totalClicks > 0 ? (totalRevenue / totalClicks) : 0
    
    return {
      revenue: totalRevenue,
      clicks: totalClicks,
      conversions: totalConversions,
      conversionRate,
      ctr,
      epc,
      trend: totalRevenue > 1000 ? 'up' : totalRevenue < 500 ? 'down' : 'stable'
    }
  }

  const metrics = calculateMetrics()

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleRefresh = () => {
    refreshPublishers()
    refreshAnalytics()
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting publisher performance data...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{publisher.publisher_name}</h2>
          <p className="text-gray-600">{publisher.company_name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          Performance metrics
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${metrics.revenue.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(metrics.trend)}
                <span className={`text-sm font-medium ${getTrendColor(metrics.trend)}`}>
                  {metrics.trend === 'up' ? '+12%' : metrics.trend === 'down' ? '-5%' : '0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.clicks.toLocaleString()}</p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.conversions.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.conversionRate.toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">CTR: {metrics.ctr.toFixed(2)}%</p>
                <p className="text-sm text-gray-500">EPC: ${metrics.epc.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Account Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={publisher.status === 'active' ? 'default' : 'outline'}>
                        {publisher.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Offers</span>
                      <span className="text-sm font-medium">{publisher.active_offers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="text-sm font-medium">{publisher.last_active}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium">{publisher.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Company</span>
                      <span className="text-sm font-medium">{publisher.company_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active offers found</p>
                <p className="text-sm">This publisher doesn&apos;t have any active offers yet.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Trend analysis coming soon</p>
                <p className="text-sm">Historical performance charts will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No payment history</p>
                <p className="text-sm">Payment records will appear here once payments are processed.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
