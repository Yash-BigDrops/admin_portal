'use client'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui'
import { CalendarDays, AlertCircle } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/useEverflowData'

const revenueData = [
  { date: '2025-01-01', revenue: 12400, clicks: 2400, conversions: 240 },
  { date: '2025-01-02', revenue: 13600, clicks: 1398, conversions: 210 },
  { date: '2025-01-03', revenue: 15800, clicks: 2800, conversions: 290 },
  { date: '2025-01-04', revenue: 14300, clicks: 3908, conversions: 300 },
  { date: '2025-01-05', revenue: 16900, clicks: 4800, conversions: 420 },
  { date: '2025-01-06', revenue: 18100, clicks: 3800, conversions: 380 },
  { date: '2025-01-07', revenue: 19400, clicks: 4300, conversions: 450 },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{`Date: ${label}`}</p>
        {payload.map((entry: { dataKey: string; value: number; color: string }, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.dataKey === 'revenue' ? '$' : ''}${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function RevenueChart() {
  const { analytics, error } = useAnalytics()

  interface AnalyticsItem {
    date?: string
    created_at?: string
    revenue?: number
    total_revenue?: number
    clicks?: number
    total_clicks?: number
    conversions?: number
    total_conversions?: number
  }

  const transformChartData = (analytics: AnalyticsItem[]) => {
    if (!analytics || analytics.length === 0) return revenueData
    
    return analytics.map((item: AnalyticsItem, index: number) => ({
      date: item.date || item.created_at || new Date(Date.now() - (analytics.length - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: item.revenue || item.total_revenue || 0,
      clicks: item.clicks || item.total_clicks || 0,
      conversions: item.conversions || item.total_conversions || 0
    }))
  }

  const chartData = transformChartData(analytics)

  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">Failed to load analytics data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Real-time data</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="clicks">Clicks</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="clicks" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="conversions" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
