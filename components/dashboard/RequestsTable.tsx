'use client';

import { useState } from 'react';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestData {
  id: string;
  date: string;
  company: string;
  offerId: string;
  type: string;
  priority: 'High Priority' | 'Moderate Priority' | 'Low Priority';
  status: 'pending' | 'approved' | 'rejected';
  client: string;
  advertiserName: string;
  submissionType: string;
}

const mockRequests: RequestData[] = [
  {
    id: '903',
    date: '25th July 2025',
    company: 'Big Drops MG',
    offerId: 'SUB ID : 903',
    type: 'INSURANCE - FINANCIAL - Super Sensitive',
    priority: 'Moderate Priority',
    status: 'pending',
    client: 'Client',
    advertiserName: 'Advertiser Name',
    submissionType: 'Email'
  },
  {
    id: '904',
    date: '25th July 2025',
    company: 'Big Drops MG',
    offerId: 'SUB ID : 904',
    type: 'INSURANCE - FINANCIAL - Super Sensitive',
    priority: 'High Priority',
    status: 'approved',
    client: 'Client',
    advertiserName: 'Advertiser Name',
    submissionType: 'Email'
  }
];

const priorityColors = {
  'High Priority': 'text-red-700 bg-red-100',
  'Moderate Priority': 'text-yellow-700 bg-yellow-100',
  'Low Priority': 'text-green-700 bg-green-100'
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle
};

const statusColors = {
  pending: 'text-yellow-600',
  approved: 'text-green-600',
  rejected: 'text-red-600'
};

export function RequestsTable() {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Incoming Publisher Requests
          </h3>
          <button className="text-sm text-indigo-600 hover:text-indigo-500">
            View All
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockRequests.map((request) => {
                const StatusIcon = statusIcons[request.status];
                return (
                  <tr key={request.id} className={selectedRequests.includes(request.id) ? 'bg-gray-50' : undefined}>
                    <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => toggleRequestSelection(request.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.date} | {request.company} - {request.offerId}
                        </div>
                        <div className="text-sm text-gray-500">
                          Offer Id : 1952 | {request.submissionType} | {request.advertiserName} | Super Sensitive - Proof Req - [US] - [Email] - [Mon-Fri Only] (1952)
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Creative Type : {request.submissionType} | Creative Count : 7 | From lines Count : 3 | Subject lines Count : 5
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                        priorityColors[request.priority]
                      )}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={cn("h-4 w-4 mr-2", statusColors[request.status])} />
                        <span className="text-sm text-gray-900 capitalize">{request.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 px-3 py-1 rounded">
                          View Request
                        </button>
                        <button className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded">
                          Approve and Forward
                        </button>
                        <button className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded">
                          Reject And Send back
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
