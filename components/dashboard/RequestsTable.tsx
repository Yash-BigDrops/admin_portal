'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RequestData {
  id: string;
  date: string;
  company: string;
  offerId: string;
  offerName: string;
  offerDescription: string;
  offerPayout: number | null;
  offerCurrency: string;
  advertiserId: string;
  advertiserName: string;
  type: string;
  priority: 'High Priority' | 'Moderate Priority' | 'Low Priority';
  status: 'pending' | 'admin_approved' | 'admin_rejected' | 'approved' | 'rejected';
  publisherName: string;
  email: string;
  submittedData: Record<string, unknown>;
}

interface RequestsResponse {
  requests: RequestData[];
}

const priorityColors = {
  'High Priority': 'text-red-700 bg-red-100 border-red-200',
  'Moderate Priority': 'text-orange-700 bg-orange-100 border-orange-200',
  'Low Priority': 'text-green-700 bg-green-100 border-green-200'
};


export function RequestsTable() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log('Fetching requests from API...');
        const limit = showAll ? 100 : 2; 
        const response = await fetch(`/api/dashboard/requests?limit=${limit}`);
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
  }, [showAll]);


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


  const handleViewAll = () => {
    setShowAll(true);
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold text-white">
              Incoming Publisher Requests
            </h3>
          </div>
          <button 
            onClick={handleViewAll}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30"
          >
            View All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="border border-blue-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-purple-50 animate-pulse">
                <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </div>
            <p className="text-gray-600 text-lg">No requests found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
              <div key={request.id} className={`border-2 rounded-xl p-6 bg-gradient-to-br transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                index % 2 === 0 
                  ? 'from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300' 
                  : 'from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300'
              }`}>
                <div className="flex justify-between items-start">
                  {/* Left Content */}
                  <div className="flex-1">
                    <div className="space-y-3">
                      {/* Date & Company */}
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <div className="text-sm font-semibold text-gray-800">
                          {request.date} | {request.company} - SUB ID: {request.id.slice(-3)}
                        </div>
                      </div>
                      
                      {/* Offer Details */}
                      <div className="text-sm text-gray-700 bg-white/60 rounded-lg p-3 border border-white/80">
                        <span className="font-medium text-gray-600">Offer Id:</span> {request.offerId} | <span className="font-semibold text-gray-800">{request.offerName}</span>
                      </div>
                      
                      {/* Client Information */}
                      <div className="text-sm text-gray-700 bg-white/60 rounded-lg p-3 border border-white/80">
                        <span className="font-medium text-gray-600">Client:</span> {request.advertiserId} | <span className="font-semibold text-gray-800">{request.advertiserName}</span>
                      </div>
                      
                      {/* Creative Details & Priority */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Creative type: <span className="font-medium text-gray-800">{request.type}</span> | Creative Count: 2 | From lines Count: 3 | Subject lines Count: 5
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border-2", priorityColors[request.priority])}>
                          {request.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col space-y-3 text-sm font-medium ml-6">
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
                      View Request
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprovalClick(request, 'approve')}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          Approve and Forward
                        </button>
                        <button 
                          onClick={() => handleApprovalClick(request, 'reject')}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          Reject And Send back
                        </button>
                      </>
                    )}
                    {request.status === 'admin_approved' && (
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-lg border border-blue-300 text-center">
                        Admin Approved
                      </span>
                    )}
                    {request.status === 'admin_rejected' && (
                      <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-800 rounded-lg border border-red-300 text-center">
                        Admin Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
          <div className="relative top-20 mx-auto p-6 border-2 w-96 shadow-2xl rounded-xl bg-gradient-to-br from-white to-blue-50 border-blue-200">
            <div className="mt-3">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-3 h-3 rounded-full ${approvalAction === 'approve' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h3 className={`text-lg font-bold ${approvalAction === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                  {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h3>
              </div>
              
              {selectedRequest && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold text-blue-800">Publisher:</span> {selectedRequest.publisherName}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold text-blue-800">Company:</span> {selectedRequest.company}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-blue-800">Offer ID:</span> {selectedRequest.offerId}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  rows={3}
                  placeholder="Add notes about this decision..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={processing}
                  className={`px-6 py-3 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${
                    approvalAction === 'approve'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
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