import { NextResponse } from 'next/server'

export async function GET() {
  const mockPublishers = [
    {
      publisher_id: 1,
      publisher_name: 'TechCorp Marketing',
      email: 'contact@techcorp.com',
      company_name: 'TechCorp Inc',
      status: 'active',
      revenue: 15420,
      total_revenue: 15420,
      last_active: '2025-01-15',
      active_offers: 12,
      offers_count: 12
    },
    {
      publisher_id: 2,
      publisher_name: 'Digital Growth Co',
      email: 'info@digitalgrowth.com',
      company_name: 'Digital Growth Co',
      status: 'pending',
      revenue: 0,
      total_revenue: 0,
      last_active: '2025-01-14',
      active_offers: 0,
      offers_count: 0
    },
    {
      publisher_id: 3,
      publisher_name: 'Affiliate Pro',
      email: 'team@affiliatepro.com',
      company_name: 'Affiliate Pro LLC',
      status: 'active',
      revenue: 28950,
      total_revenue: 28950,
      last_active: '2025-01-15',
      active_offers: 8,
      offers_count: 8
    },
    {
      publisher_id: 4,
      publisher_name: 'Growth Partners',
      email: 'hello@growthpartners.com',
      company_name: 'Growth Partners Inc',
      status: 'suspended',
      revenue: 0,
      total_revenue: 0,
      last_active: '2025-01-10',
      active_offers: 0,
      offers_count: 0
    },
    {
      publisher_id: 5,
      publisher_name: 'Marketing Masters',
      email: 'contact@marketingmasters.com',
      company_name: 'Marketing Masters Ltd',
      status: 'active',
      revenue: 18750,
      total_revenue: 18750,
      last_active: '2025-01-15',
      active_offers: 15,
      offers_count: 15
    }
  ]

  return NextResponse.json({
    data: mockPublishers,
    total: mockPublishers.length,
    success: true
  })
}
