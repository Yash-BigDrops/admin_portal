'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock
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
  submittedData: Record<string, unknown>;
}

interface ResponsesResponse {
  responses: ResponseData[];
}

const priorityColors = {
  'High Priority': 'text-red-700 bg-red-100 border-red-200',
  'Moderate Priority': 'text-orange-700 bg-orange-100 border-orange-200',
  'Low Priority': 'text-green-700 bg-green-100 border-green-200'
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
    <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-xl">
      <div className="px-6 py-5 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">
              Incoming Advertiser Response
              {!showAll && (
                <span className="text-sm font-normal text-purple-600 ml-2">
                  (Latest 2)
                </span>
              )}
              {showAll && (
                <span className="text-sm font-normal text-purple-600 ml-2">
                  (All {responses.length} responses)
                </span>
              )}
            </h3>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Refresh
            </button>
            {!showAll && (
              <button 
                onClick={handleViewAll}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                View All
              </button>
            )}
            {showAll && (
              <button 
                onClick={() => setShowAll(false)}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Show Latest 2
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden shadow-2xl ring-2 ring-purple-200 rounded-xl">
          <table className="min-w-full divide-y divide-purple-200">
            <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
              <tr>
                <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-white text-white focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Company Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Type & Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-br from-white to-purple-50 divide-y divide-purple-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-3/4 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : responses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                    </div>
                    <p className="text-gray-600 text-lg">No advertiser responses found</p>
                  </td>
                </tr>
              ) : (
                responses.map((response) => {
                  const StatusIcon = statusIcons[response.status];
                  return (
                    <tr key={response.id} className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 ${
                      selectedResponses.includes(response.id) ? 'bg-purple-100' : 'bg-white'
                    }`}>
                      <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
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
                          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold">
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
