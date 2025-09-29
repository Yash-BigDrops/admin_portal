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
}

const mockMetrics: MetricData[] = [
  {
    label: 'Total Assets',
    value: '1263',
    change: '+400 from yesterday',
    changeType: 'increase',
    icon: FileText,
    color: 'blue'
  },
  {
    label: 'New Asset Requests',
    value: '201',
    change: '+400 from yesterday',
    changeType: 'increase',
    icon: Clock,
    color: 'orange'
  },
  {
    label: 'Approved Asset Count',
    value: '552',
    change: '+400 from yesterday',
    changeType: 'increase',
    icon: CheckCircle,
    color: 'green'
  },
  {
    label: 'Rejected Assets',
    value: '210',
    change: '+400 from yesterday',
    changeType: 'increase',
    icon: XCircle,
    color: 'red'
  },
  {
    label: 'Pending Approvals',
    value: '300',
    change: '+400 from yesterday',
    changeType: 'increase',
    icon: Users,
    color: 'purple'
  }
];

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
            <span className="ml-2 text-gray-500">400</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <span className="text-xs">Yesterday</span>
            <span className="ml-2 text-xs">400</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <span className="text-xs">Current Month</span>
            <span className="ml-2 text-xs">25k</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <span className="text-xs">Last Month</span>
            <span className="ml-2 text-xs">10.8k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {mockMetrics.map((metric, index) => (
        <MetricCard key={index} metric={metric} />
      ))}
    </div>
  );
}
