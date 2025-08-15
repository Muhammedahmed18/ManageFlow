import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Clock, Award, TrendingUp, Users, X, Loader2, Building,
  ArrowRight, ArrowLeft, Eye, Check, X as XIcon
} from 'lucide-react';
import { colors } from '../../constants/theme';
import JoinBusinessModal from './JoinBusinessModal';
import RequestDetailModal from './RequestDetailModal';

const Requests = ({ 
  requests,
  requestStats,
  requestsLoading,
  filteredRequests,
  selectedRequest,
  showRequestDetail,
  fetchRequestDetail,
  setShowRequestDetail,
  getRequestStatusColor,
  getRequestStatusIcon,
  formatDate,
  setActiveTab,
  refreshRequests,
  fetchIncomingRequests,
  fetchIncomingRequestDetail
}) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeRequestTab, setActiveRequestTab] = useState('my-requests');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [incomingRequestsLoading, setIncomingRequestsLoading] = useState(false);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestTabs = [
    { id: 'my-requests', name: 'My Requests', icon: FileText },
    { id: 'customer-requests', name: 'Customer Requests', icon: Users }
  ];

  // Fetch incoming requests when customer-requests tab is selected
  const handleTabChange = async (tabId) => {
    setActiveRequestTab(tabId);
    if (tabId === 'customer-requests' && incomingRequests.length === 0) {
      setIncomingRequestsLoading(true);
      try {
        const data = await fetchIncomingRequests();
        setIncomingRequests(data);
      } catch (error) {
        console.error('Error fetching incoming requests:', error);
      } finally {
        setIncomingRequestsLoading(false);
      }
    }
  };

  // Handle viewing request details
  const handleViewRequestDetails = async (request, isIncoming = false) => {
    try {
      let requestData;
      if (isIncoming) {
        // Fetch incoming request details
        requestData = await fetchIncomingRequestDetail(request.id);
      } else {
        // Use existing request data for outgoing requests
        requestData = request;
      }
      setCurrentRequest(requestData);
      setShowRequestDetailModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  // Handle request actions
  const handleApproveRequest = async (requestId) => {
    setIsProcessing(true);
    try {
      // TODO: Implement approve API call
      console.log('Approving request:', requestId);
      // await api.post(`/management/manufacturer/requests/${requestId}/approve/`);
      setShowRequestDetailModal(false);
      refreshRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setIsProcessing(true);
    try {
      // TODO: Implement reject API call
      console.log('Rejecting request:', requestId);
      // await api.post(`/management/manufacturer/requests/${requestId}/reject/`);
      setShowRequestDetailModal(false);
      refreshRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinBusiness = (request) => {
    // Set business info for the join modal
    setSelectedCustomer({
      businessName: request.business_name,
      customerName: request.customer_name,
      businessId: request.business_id
    });
    setShowJoinModal(true);
  };

  const handleManageBusiness = (request) => {
    // Navigate to business management dashboard
    if (request.business_id) {
      window.location.href = `/manage/${request.business_id}`;
    }
  };

  const handleRespondToRequest = async (requestId, message) => {
    setIsProcessing(true);
    try {
      // TODO: Implement respond API call
      console.log('Responding to request:', requestId, message);
      // await api.post(`/management/manufacturer/requests/${requestId}/respond/`, { message });
      setShowRequestDetailModal(false);
      refreshRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {requestTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeRequestTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeRequestTab === 'my-requests' && (
        <div>
          {/* Request Statistics */}
          {requestStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl shadow-sm border p-4"
                style={{ 
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      Total Requests
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {requestStats.total_requests}
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <FileText className="h-5 w-5" style={{ color: colors.accent }} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl shadow-sm border p-4"
                style={{ 
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      Pending
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {requestStats.pending_requests}
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.warning}20` }}
                  >
                    <Clock className="h-5 w-5" style={{ color: colors.warning }} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl shadow-sm border p-4"
                style={{ 
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      Approved
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {requestStats.approved_requests}
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <Award className="h-5 w-5" style={{ color: colors.success }} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl shadow-sm border p-4"
                style={{ 
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border 
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                      {requestStats.success_rate}%
                    </p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <TrendingUp className="h-5 w-5" style={{ color: colors.primary }} />
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Request Limit Warning */}
          {requestStats && !requestStats.can_send_new_request && (
            <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: colors.warning + '10', borderColor: colors.warning }}>
              <div className="flex items-center space-x-2">
                <Clock size={20} style={{ color: colors.warning }} />
                <div>
                  <p className="font-medium" style={{ color: colors.warning }}>
                    Request Limit Reached
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    You have {requestStats.pending_requests} pending requests. Please wait for responses before sending new requests.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* My Requests List */}
          {requestsLoading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent mx-auto" style={{ borderColor: colors.accent, borderTopColor: 'transparent' }} />
              <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>Loading your requests...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-6 hover:shadow-md transition-shadow"
                  style={{ 
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border 
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                        <ArrowRight size={20} style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: colors.textPrimary }}>
                          {request.customer_name}
                        </h4>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          Sent to customer
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRequestStatusColor(request.status)}`}>
                      {getRequestStatusIcon(request.status)}
                      <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Building size={14} />
                      <span>Business: {request.business_name}</span>
                    </div>
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Clock size={14} />
                      <span>Sent: {formatDate(request.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <FileText size={14} />
                      <span>Request #{request.id}</span>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="mb-4">
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {request.message.length > 150 
                        ? `${request.message.substring(0, 150)}...` 
                        : request.message}
                    </p>
                  </div>

                  {/* Business Information for Approved Requests */}
                  {request.status === 'approved' && !request.is_joined && (
                    <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: colors.success + '10', borderColor: colors.success }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm" style={{ color: colors.success }}>
                            Business Ready to Join
                          </h4>
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {request.business_name} • Contact: {request.customer_name}
                          </p>
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            Contact {request.customer_name} to get the invite code
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success + '20' }}>
                          <Check size={16} style={{ color: colors.success }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Business Information for Already Joined Businesses */}
                  {request.status === 'approved' && request.is_joined && (
                    <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm" style={{ color: colors.primary }}>
                            Business Joined Successfully
                          </h4>
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {request.business_name} • You are now managing this business
                          </p>
                          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            Access business management from your dashboard
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                          <Check size={16} style={{ color: colors.primary }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleViewRequestDetails(request, false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: colors.primary + '10', color: colors.primary }}
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                    
                    {/* Join Business Button for Approved Requests */}
                    {request.status === 'approved' && !request.is_joined && (
                      <button
                        onClick={() => handleJoinBusiness(request)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: colors.success + '10', color: colors.success }}
                      >
                        <Building size={16} />
                        <span>Join Business</span>
                      </button>
                    )}
                    
                    {/* Joined Status and Manage Button for Already Joined Businesses */}
                    {request.status === 'approved' && request.is_joined && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: colors.primary + '10', color: colors.primary }}
                        >
                          <Check size={16} />
                          <span>Joined</span>
                        </div>
                        <button
                          onClick={() => handleManageBusiness(request)}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ backgroundColor: colors.accent + '10', color: colors.accent }}
                        >
                          <Building size={16} />
                          <span>Manage</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeRequestTab === 'customer-requests' && (
        <div>
          {/* Customer Requests Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl shadow-sm border p-4"
              style={{ 
                backgroundColor: colors.cardBg,
                borderColor: colors.border 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {incomingRequests.length}
                  </p>
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Users className="h-5 w-5" style={{ color: colors.accent }} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl shadow-sm border p-4"
              style={{ 
                backgroundColor: colors.cardBg,
                borderColor: colors.border 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Pending
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {incomingRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.warning}20` }}
                >
                  <Clock className="h-5 w-5" style={{ color: colors.warning }} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl shadow-sm border p-4"
              style={{ 
                backgroundColor: colors.cardBg,
                borderColor: colors.border 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Approved
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {incomingRequests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.success}20` }}
                >
                  <Award className="h-5 w-5" style={{ color: colors.success }} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl shadow-sm border p-4"
              style={{ 
                backgroundColor: colors.cardBg,
                borderColor: colors.border 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Rejected
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {incomingRequests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.error}20` }}
                >
                  <X className="h-5 w-5" style={{ color: colors.error }} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Customer Requests List */}
          {incomingRequestsLoading ? (
            <div className="text-center py-16">
              <Loader2 className="mx-auto animate-spin text-gray-400" size={48} />
              <p className="mt-4 text-gray-500">Loading customer requests...</p>
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="text-center py-16">
              <Users className="mx-auto text-gray-400" size={48} />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Customer Requests</h3>
              <p className="mt-2 text-gray-500">
                You haven't received any requests from customers yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-6 hover:shadow-md transition-shadow"
                  style={{ 
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border 
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.success + '20' }}>
                        <ArrowLeft size={20} style={{ color: colors.success }} />
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: colors.textPrimary }}>
                          {request.customer_name}
                        </h4>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          Received from customer
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRequestStatusColor(request.status)}`}>
                      {getRequestStatusIcon(request.status)}
                      <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Building size={14} />
                      <span>Business: {request.business_name}</span>
                    </div>
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Clock size={14} />
                      <span>Received: {formatDate(request.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <FileText size={14} />
                      <span>Request #{request.id}</span>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="mb-4">
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {request.message.length > 150 
                        ? `${request.message.substring(0, 150)}...` 
                        : request.message}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                            style={{ backgroundColor: colors.success }}
                          >
                            <Check size={16} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                            style={{ borderColor: colors.error, color: colors.error }}
                          >
                            <XIcon size={16} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewRequestDetails(request, true)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: colors.primary + '10', color: colors.primary }}
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Business Modal */}
              <JoinBusinessModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          customerName={selectedCustomer?.customerName}
          businessName={selectedCustomer?.businessName}
          businessInfo={selectedCustomer}
          onSuccess={(data) => {
            setShowJoinModal(false);
            setSelectedCustomer(null);
            // Refresh requests to update the UI immediately
            refreshRequests();
            // Redirect to business dashboard after a short delay to show success
            setTimeout(() => {
              if (data && data.business_id) {
                window.location.href = `/manage/${data.business_id}`;
              }
            }, 1000);
          }}
        />

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={currentRequest}
        isOpen={showRequestDetailModal}
        onClose={() => {
          setShowRequestDetailModal(false);
          setCurrentRequest(null);
        }}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onRespond={handleRespondToRequest}
        isProcessing={isProcessing}
      />
    </motion.div>
  );
};

export default Requests;


