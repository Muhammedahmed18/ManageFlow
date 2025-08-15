import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Users, Clock, CheckCircle, XCircle, Eye, 
  MessageCircle, Building, Calendar, MapPin, Filter,
  Search, ChevronDown, ChevronRight, ExternalLink
} from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';
import RejectionModal from './modals/RejectionModal';

const ContactRequests = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingRejection, setPendingRejection] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch received requests (incoming from manufacturers)
      const receivedResponse = await api.get('/management/customer/requests/');
      console.log('Received requests response:', receivedResponse.data);
      const receivedData = (receivedResponse.data || []).map(req => ({
        id: req.id,
        manufacturer: {
          id: req.manufacturer?.id,
          name: req.manufacturer_name || 'Unknown Manufacturer',
          location: req.manufacturer_location || 'Location not specified',
          industry: req.manufacturer_company || 'General Manufacturing'
        },
        message: req.message || 'No message provided',
        status: req.status || 'pending',
        customer_response: req.customer_response || '',
        createdAt: req.created_at,
        updatedAt: req.responded_at || req.created_at
      }));
      setReceivedRequests(receivedData);

      // Fetch sent requests (outgoing to manufacturers)
      const sentResponse = await api.get('/management/customer/my-requests/');
      console.log('Sent requests response:', sentResponse.data);
      const sentData = (sentResponse.data || []).map(req => ({
        id: req.id,
        manufacturer: {
          id: req.customer?.id,
          name: req.customer_name || 'Unknown Customer',
          location: req.customer_location || 'Location not specified',
          industry: req.customer_company || 'General'
        },
        message: req.message || 'No message provided',
        status: req.status || 'pending',
        createdAt: req.created_at,
        updatedAt: req.responded_at || req.created_at
      }));
      setSentRequests(sentData);
      
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      setReceivedRequests([]);
      setSentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await api.patch(`/management/customer/requests/${requestId}/`, {
        action: newStatus === 'approved' ? 'approve' : 'reject',
        response_message: '',
        notes: ''
      });
      
      // Refresh the requests
      fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleRejectClick = (request) => {
    setPendingRejection(request);
    setShowRejectionModal(true);
  };

  const handleRejectWithReason = async (rejectionReason) => {
    try {
      await api.patch(`/management/customer/requests/${pendingRejection.id}/`, {
        action: 'reject',
        rejection_reason: rejectionReason,
        response_message: '',
        notes: ''
      });
      
      // Refresh the requests
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  };

  const handleSendMessage = async (request) => {
    try {
      // Create chat room if doesn't exist
      const response = await api.post('/management/chat-rooms/create_from_request/', {
        request_id: request.id
      });
      
      // Navigate to chats section
      window.location.hash = '#chats';
      
      // Store chat room info for ChatManager to open
      localStorage.setItem('openChatRoom', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error creating chat room:', error);
      // Fallback to old method if API fails
      window.location.hash = '#chats';
      localStorage.setItem('selectedChatManufacturer', JSON.stringify({
        id: request.manufacturer.id,
        name: request.manufacturer.name
      }));
    }
  };

  const handleViewProfile = (request) => {
    setSelectedRequest(request);
    setShowProfileModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filterRequests = (requests) => {
    return requests.filter(request => {
      const matchesSearch = request.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;
  const filteredRequests = filterRequests(currentRequests);
  
  // Debug logging
  console.log('Active tab:', activeTab);
  console.log('Received requests count:', receivedRequests.length);
  console.log('Sent requests count:', sentRequests.length);
  console.log('Current requests:', currentRequests);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Contact Requests
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage your business connections and partnerships
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Received Requests</span>
            {receivedRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {receivedRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sent'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Sent Requests</span>
            {sentRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {sentRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search manufacturers or messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} requests found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : `You haven't ${activeTab === 'received' ? 'received any' : 'sent any'} contact requests yet.`
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {request.manufacturer.name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activeTab === 'received' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activeTab === 'received' ? 'Received' : 'Sent'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {request.manufacturer.location}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {request.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {expandedRequest === request.id ? (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Less
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-1" />
                              More
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRequest === request.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Manufacturer Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Industry:</span>
                              <span className="text-gray-900">{request.manufacturer.industry}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Location:</span>
                              <span className="text-gray-900">{request.manufacturer.location}</span>
                            </div>
                          </div>
                          
                          {/* Rejection Reason */}
                          {request.status === 'rejected' && request.customer_response && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <h5 className="font-medium text-red-900 mb-2 text-sm">Rejection Reason:</h5>
                              <p className="text-sm text-red-700 leading-relaxed">
                                {request.customer_response}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                          <div className="space-y-2">
                            {activeTab === 'received' && request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve Request
                                </button>
                                <button
                                  onClick={() => handleRejectClick(request)}
                                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Request
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleSendMessage(request)}
                              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              {request.status === 'rejected' && request.customer_response ? 'Send Follow-up Message' : 'Send Message'}
                            </button>
                            <button 
                              onClick={() => handleViewProfile(request)}
                              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Request Details
                  </h2>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Manufacturer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Manufacturer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 text-gray-900 font-medium">{selectedRequest.manufacturer.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 text-gray-900">{selectedRequest.manufacturer.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <span className="ml-2 text-gray-900">{selectedRequest.manufacturer.industry}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Request Type:</span>
                        <span className="ml-2 text-gray-900 capitalize">{selectedRequest.request_type || 'contact'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Request Details</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusIcon(selectedRequest.status)}
                          <span className="ml-1 capitalize">{selectedRequest.status}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(selectedRequest.createdAt).toLocaleDateString()} at {new Date(selectedRequest.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt && (
                        <div>
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(selectedRequest.updatedAt).toLocaleDateString()} at {new Date(selectedRequest.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Message</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedRequest.message}
                    </p>
                  </div>

                  {/* Customer Response (if any) */}
                  {selectedRequest.customer_response && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-3">Your Response</h3>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {selectedRequest.customer_response}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        handleSendMessage(selectedRequest);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setPendingRejection(null);
        }}
        onReject={handleRejectWithReason}
        manufacturerName={pendingRejection?.manufacturer?.name || 'Manufacturer'}
      />
    </div>
  );
};

export default ContactRequests;
