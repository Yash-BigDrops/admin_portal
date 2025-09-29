'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  label: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  today?: number;
  yesterday?: number;
  currentMonth?: number;
  lastMonth?: number;
}

interface MetricsResponse {
  totalAssets: number;
  newRequests: number;
  approvedAssets: number;
  rejectedAssets: number;
  pendingAssets: number;
  today: number;
  yesterday: number;
  currentMonth: number;
  lastMonth: number;
}

const colorClasses = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500'
};

interface MetricCardProps {
  metric: MetricData;
}

function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              colorClasses[metric.color as keyof typeof colorClasses]
            )}>
              <metric.icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {metric.label}
              </dt>
              <dd>
                <div className="text-3xl font-semibold text-gray-900">
                  {metric.value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <div className="flex items-center text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">Today</span>
            <span className="ml-2 text-gray-500">{metric.today || 0}</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <span className="text-xs">Yesterday</span>
            <span className="ml-2 text-xs">{metric.yesterday || 0}</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <span className="text-xs">Current Month</span>
            <span className="ml-2 text-xs">{metric.currentMonth || 0}</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <span className="text-xs">Last Month</span>
            <span className="ml-2 text-xs">{metric.lastMonth || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricsCards() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 text-center">
          <p className="text-gray-500">Failed to load metrics</p>
        </div>
      </div>
    );
  }

  const metricsData: MetricData[] = [
    {
      label: 'Total Assets',
      value: metrics.totalAssets.toString(),
      change: 'All time',
      changeType: 'increase',
      icon: FileText,
      color: 'blue',
      today: metrics.today,
      yesterday: metrics.yesterday,
      currentMonth: metrics.currentMonth,
      lastMonth: metrics.lastMonth
    },
    {
      label: 'New Asset Requests',
      value: metrics.newRequests.toString(),
      change: 'Today',
      changeType: 'increase',
      icon: Clock,
      color: 'orange',
      today: metrics.today,
      yesterday: metrics.yesterday,
      currentMonth: metrics.currentMonth,
      lastMonth: metrics.lastMonth
    },
    {
      label: 'Approved Asset Count',
      value: metrics.approvedAssets.toString(),
      change: 'All time',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'green',
      today: metrics.today,
      yesterday: metrics.yesterday,
      currentMonth: metrics.currentMonth,
      lastMonth: metrics.lastMonth
    },
    {
      label: 'Rejected Assets',
      value: metrics.rejectedAssets.toString(),
      change: 'All time',
      changeType: 'increase',
      icon: XCircle,
      color: 'red',
      today: metrics.today,
      yesterday: metrics.yesterday,
      currentMonth: metrics.currentMonth,
      lastMonth: metrics.lastMonth
    },
    {
      label: 'Pending Approvals',
      value: metrics.pendingAssets.toString(),
      change: 'All time',
      changeType: 'increase',
      icon: Users,
      color: 'purple',
      today: metrics.today,
      yesterday: metrics.yesterday,
      currentMonth: metrics.currentMonth,
      lastMonth: metrics.lastMonth
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {metricsData.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  );
}
