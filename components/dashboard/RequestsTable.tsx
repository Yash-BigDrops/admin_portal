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

interface RequestData {
  id: string;
  date: string;
  company: string;
  offerId: string;
  type: string;
  priority: 'High Priority' | 'Moderate Priority' | 'Low Priority';
  status: 'pending' | 'admin_approved' | 'admin_rejected' | 'approved' | 'rejected';
  publisherName: string;
  email: string;
  submittedData: any;
}

interface RequestsResponse {
  requests: RequestData[];
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

export function RequestsTable() {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log('Fetching requests from API...');
        const response = await fetch('/api/dashboard/requests?limit=10');
        if (response.ok) {
          const data: RequestsResponse = await response.json();
          console.log('API Response:', data);
          console.log('Number of requests:', data.requests.length);
          setRequests(data.requests);
        } else {
          console.error('API Response not OK:', response.status);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleApprovalClick = (request: RequestData, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setAdminNotes('');
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedRequest || !approvalAction) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/dashboard/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: approvalAction,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the request in the local state
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: result.request.status }
            : req
        ));

        setShowApprovalModal(false);
        setSelectedRequest(null);
        setApprovalAction(null);
        setAdminNotes('');
      } else {
        console.error('Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setShowApprovalModal(false);
    setSelectedRequest(null);
    setApprovalAction(null);
    setAdminNotes('');
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      console.log('Refreshing requests data...');
      const response = await fetch('/api/dashboard/requests?limit=10');
      if (response.ok) {
        const data: RequestsResponse = await response.json();
        console.log('Refreshed data:', data);
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error refreshing requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Incoming Publisher Requests
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={refreshData}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Refresh
            </button>
            <button className="text-sm text-indigo-600 hover:text-indigo-500">
              View All
            </button>
          </div>
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
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
                            Publisher: {request.publisherName} | Email: {request.email}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Creative Type: {request.type} | Priority: {request.priority}
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
                          {request.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApprovalClick(request, 'approve')}
                                className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleApprovalClick(request, 'reject')}
                                className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'admin_approved' && (
                            <span className="text-blue-600 text-sm">Admin Approved</span>
                          )}
                          {request.status === 'admin_rejected' && (
                            <span className="text-red-600 text-sm">Admin Rejected</span>
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

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
              
              {selectedRequest && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>Publisher:</strong> {selectedRequest.publisherName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Company:</strong> {selectedRequest.company}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Offer ID:</strong> {selectedRequest.offerId}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Add notes about this decision..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={processing}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing ? 'Processing...' : (approvalAction === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
