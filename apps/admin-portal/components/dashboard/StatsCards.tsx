'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { TrendingUp, TrendingDown, Users, DollarSign, MousePointer, Target, AlertCircle } from 'lucide-react'
import { Badge } from '@repo/ui'
import { useAnalytics, usePublishers } from '@/lib/hooks/useEverflowData'

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const StatCard = ({ title, value, change, trend, icon: Icon, description }: StatCardProps) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="flex items-center mt-2">
        {trend === 'up' ? (
          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
        )}
        <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-xs">
          {change}
        </Badge>
        <span className="text-xs text-gray-500 ml-2">vs last month</span>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
)

export default function StatsCards() {
  const { analytics, error: analyticsError, isLoading: analyticsLoading } = useAnalytics()
  const { publishers, error: publishersError, isLoading: publishersLoading } = usePublishers()

  const isLoading = analyticsLoading || publishersLoading
  const hasError = analyticsError || publishersError

interface AnalyticsItem {
  revenue?: number
  clicks?: number
  conversions?: number
}

interface Publisher {
  status: string
}

  const totalRevenue = analytics.reduce((sum: number, item: AnalyticsItem) => sum + (item.revenue || 0), 0)
  const totalClicks = analytics.reduce((sum: number, item: AnalyticsItem) => sum + (item.clicks || 0), 0)
  const totalConversions = analytics.reduce((sum: number, item: AnalyticsItem) => sum + (item.conversions || 0), 0)
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0
  const activePublishers = publishers.filter((p: Publisher) => p.status === 'active').length

  const stats = [
    {
      title: "Total Revenue",
      value: isLoading ? "--" : `$${totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
      description: "Revenue from all publishers"
    },
    {
      title: "Active Publishers",
      value: isLoading ? "--" : activePublishers.toLocaleString(),
      change: "+8.2%",
      trend: "up" as const,
      icon: Users,
      description: "Publishers with active campaigns"
    },
    {
      title: "Conversion Rate",
      value: isLoading ? "--" : `${conversionRate.toFixed(2)}%`,
      change: "-0.8%",
      trend: "down" as const,
      icon: Target,
      description: "Average conversion across offers"
    },
    {
      title: "Total Clicks",
      value: isLoading ? "--" : totalClicks.toLocaleString(),
      change: "+0.3%",
      trend: "up" as const,
      icon: MousePointer,
      description: "Total clicks across campaigns"
    }
  ]

  if (hasError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Error</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">--</div>
              <p className="text-xs text-red-500 mt-1">Failed to load data</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
