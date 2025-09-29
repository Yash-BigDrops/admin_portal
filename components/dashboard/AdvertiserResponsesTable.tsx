'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponseData {
  id: string;
  date: string;
  company: string;
  offerId: string;
  offerName: string;
  offerDescription: string;
  offerPayout: number | null;
  offerCurrency: string;
  type: string;
  priority: 'High Priority' | 'Moderate Priority' | 'Low Priority';
  status: 'pending' | 'admin_approved' | 'admin_rejected' | 'approved' | 'rejected';
  publisherName: string;
  email: string;
  submittedData: any;
}

interface ResponsesResponse {
  responses: ResponseData[];
}

const priorityColors = {
  'High Priority': 'text-red-700 bg-red-100',
  'Moderate Priority': 'text-yellow-700 bg-yellow-100',
  'Low Priority': 'text-green-700 bg-green-100'
};

const statusIcons = {
  pending: Clock,
  admin_approved: CheckCircle,
  admin_rejected: XCircle,
  approved: CheckCircle,
  rejected: XCircle
};

const statusColors = {
  pending: 'text-yellow-600',
  admin_approved: 'text-blue-600',
  admin_rejected: 'text-red-600',
  approved: 'text-green-600',
  rejected: 'text-red-600'
};

export function AdvertiserResponsesTable() {
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        console.log('Fetching advertiser responses from API...');
        const limit = showAll ? 100 : 2;
        const response = await fetch(`/api/dashboard/advertiser-responses?limit=${limit}`);
        if (response.ok) {
          const data: ResponsesResponse = await response.json();
          console.log('API Response:', data);
          console.log('Number of responses:', data.responses.length);
          setResponses(data.responses);
        } else {
          console.error('API Response not OK:', response.status);
        }
      } catch (error) {
        console.error('Error fetching advertiser responses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [showAll]);

  const toggleResponseSelection = (responseId: string) => {
    setSelectedResponses(prev =>
      prev.includes(responseId)
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      console.log('Refreshing advertiser responses data...');
      const limit = showAll ? 100 : 2;
      const response = await fetch(`/api/dashboard/advertiser-responses?limit=${limit}`);
      if (response.ok) {
        const data: ResponsesResponse = await response.json();
        console.log('Refreshed data:', data);
        setResponses(data.responses);
      }
    } catch (error) {
      console.error('Error refreshing advertiser responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    setShowAll(true);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Incoming Advertiser Response
            {!showAll && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Latest 2)
              </span>
            )}
            {showAll && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (All {responses.length} responses)
              </span>
            )}
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={refreshData}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Refresh
            </button>
            {!showAll && (
              <button 
                onClick={handleViewAll}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                View All
              </button>
            )}
            {showAll && (
              <button 
                onClick={() => setShowAll(false)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Show Latest 2
              </button>
            )}
          </div>
        </div>

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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : responses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No advertiser responses found
                  </td>
                </tr>
              ) : (
                responses.map((response) => {
                  const StatusIcon = statusIcons[response.status];
                  return (
                    <tr key={response.id} className={selectedResponses.includes(response.id) ? 'bg-gray-50' : undefined}>
                      <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600"
                          checked={selectedResponses.includes(response.id)}
                          onChange={() => toggleResponseSelection(response.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {response.date} | {response.company}
                          </div>
                          <div className="text-sm font-semibold text-indigo-600">
                            {response.offerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Publisher: {response.publisherName} | Email: {response.email}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Creative Type: {response.type} | Priority: {response.priority}
                          </div>
                          {response.offerPayout && (
                            <div className="text-sm text-green-600 font-medium">
                              Payout: {response.offerCurrency} {response.offerPayout}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                          priorityColors[response.priority]
                        )}>
                          {response.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={cn("h-4 w-4 mr-2", statusColors[response.status])} />
                          <span className="text-sm text-gray-900 capitalize">{response.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 px-3 py-1 rounded">
                            View Response
                          </button>
                          {response.status === 'admin_approved' && (
                            <span className="text-blue-600 text-sm">Approved</span>
                          )}
                          {response.status === 'admin_rejected' && (
                            <span className="text-red-600 text-sm">Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
