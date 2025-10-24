import { NextResponse } from 'next/server'

export async function GET() {
  const mockAnalytics = [
    {
      date: '2025-01-08',
      revenue: 12400,
      total_revenue: 12400,
      clicks: 2400,
      total_clicks: 2400,
      conversions: 240,
      total_conversions: 240
    },
    {
      date: '2025-01-09',
      revenue: 13600,
      total_revenue: 13600,
      clicks: 1398,
      total_clicks: 1398,
      conversions: 210,
      total_conversions: 210
    },
    {
      date: '2025-01-10',
      revenue: 15800,
      total_revenue: 15800,
      clicks: 2800,
      total_clicks: 2800,
      conversions: 290,
      total_conversions: 290
    },
    {
      date: '2025-01-11',
      revenue: 14200,
      total_revenue: 14200,
      clicks: 1890,
      total_clicks: 1890,
      conversions: 180,
      total_conversions: 180
    },
    {
      date: '2025-01-12',
      revenue: 16800,
      total_revenue: 16800,
      clicks: 3200,
      total_clicks: 3200,
      conversions: 320,
      total_conversions: 320
    },
    {
      date: '2025-01-13',
      revenue: 19200,
      total_revenue: 19200,
      clicks: 2800,
      total_clicks: 2800,
      conversions: 380,
      total_conversions: 380
    },
    {
      date: '2025-01-14',
      revenue: 17500,
      total_revenue: 17500,
      clicks: 2100,
      total_clicks: 2100,
      conversions: 350,
      total_conversions: 350
    }
  ]

  return NextResponse.json({
    data: mockAnalytics,
    total: mockAnalytics.length,
    success: true
  })
}
