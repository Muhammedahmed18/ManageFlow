import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Clock, CheckCircle, XCircle, Eye, 
  Building, User, Phone, MessageCircle, Calendar,
  Filter, Search, AlertCircle, ChevronDown, MapPin, RefreshCw, Loader2
} from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import api from '../../services/authService';
import { colors } from '../../constants/theme';

const ContactRequestManager = () => {
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [responding, setResponding] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manufacturer-requests');

  const fetchRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await api.get('/management/customer/requests/');
      setRequests(response.data);
    } catch (err) {
      setError('Failed to load contact requests');
      console.error('Error fetching requests:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/management/customer/my-requests/');
      setMyRequests(response.data);
    } catch (err) {
      console.error('Error fetching my requests:', err);
      setMyRequests([]);
    }
  };

  const handleRefresh = () => {
    fetchRequests(true);
    fetchMyRequests();
  };

  const handleResponse = async (requestId, action) => {
    try {
      setResponding(requestId);
      const response = await api.patch(`/management/customer/requests/${requestId}/`, {
        action: action,
        response_message: responseMessage
      });
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'approve' ? 'approved' : 'rejected', customer_response: responseMessage }
          : req
      ));
      
      setShowDetailModal(false);
      setSelectedRequest(null);
      setResponseMessage('');
      
      showToast(response.data.message, 'success');
    } catch (err) {
      console.error('Error responding to request:', err);
      showToast('Failed to respond to request', 'error');
    } finally {
      setResponding(null);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    setResponseMessage('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.manufacturer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredMyRequests = myRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.manufacturer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.message?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchRequests();
    fetchMyRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading contact requests..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" style={{ color: colors.error }} />
          <p style={{ color: colors.textSecondary }}>{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.accent, color: 'white' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Contact Requests
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.textSecondary }}>
              Manage contact requests from manufacturers
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Tab Navigation */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('manufacturer-requests')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'manufacturer-requests'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  backgroundColor: activeTab === 'manufacturer-requests' ? colors.primary : 'transparent'
                }}
              >
                Manufacturer Requests
              </button>
              <button
                onClick={() => setActiveTab('my-requests')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'my-requests'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  backgroundColor: activeTab === 'my-requests' ? colors.primary : 'transparent'
                }}
              >
                My Requests
              </button>
            </div>
            
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.background, color: colors.textPrimary }}
              onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
              onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" style={{ color: colors.primary }} />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Total Requests</p>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {activeTab === 'manufacturer-requests' ? requests.length : myRequests.length}
                </p>
              </div>
              <Mail className="h-8 w-8" style={{ color: colors.accent }} />
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Pending</p>
                <p className="text-2xl font-bold" style={{ color: colors.warning }}>
                  {activeTab === 'manufacturer-requests' 
                    ? requests.filter(r => r.status === 'pending').length 
                    : myRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8" style={{ color: colors.warning }} />
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Approved</p>
                <p className="text-2xl font-bold" style={{ color: colors.success }}>
                  {activeTab === 'manufacturer-requests' 
                    ? requests.filter(r => r.status === 'approved').length 
                    : myRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8" style={{ color: colors.success }} />
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Rejected</p>
                <p className="text-2xl font-bold" style={{ color: colors.error }}>
                  {activeTab === 'manufacturer-requests' 
                    ? requests.filter(r => r.status === 'rejected').length 
                    : myRequests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8" style={{ color: colors.error }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.textSecondary }} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.cardBg,
                color: colors.textPrimary
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" style={{ color: colors.textSecondary }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'manufacturer-requests' && (
        <div>
          {/* Manufacturer Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
                  No contact requests found
                </h3>
                <p style={{ color: colors.textSecondary }}>
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search criteria or filters'
                    : 'You haven\'t received any contact requests yet'
                  }
                </p>
              </div>
            ) : (
              filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-6 transition-all duration-300 hover:shadow-md"
                  style={{ 
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                          {request.manufacturer_name}
                        </h3>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status}</span>
                        </div>
                        {/* Show joined badge for join requests */}
                        {request.request_type === 'join' && (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                            request.status === 'approved' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : request.status === 'rejected' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            <Building size={12} />
                            <span>{request.status === 'approved' ? 'Joined' : request.status === 'rejected' ? 'Not Joined' : 'Pending Join'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                          <Building size={14} />
                          <span>{request.business_name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                          <Mail size={14} />
                          <span>{request.manufacturer_email}</span>
                        </div>
                        
                        {request.manufacturer_location && (
                          <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                            <MapPin size={14} />
                            <span>{request.manufacturer_location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                          <Calendar size={14} />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                        {request.message}
                      </p>
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-2">
                      <button
                        onClick={() => openDetailModal(request)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResponse(request.id, 'approve')}
                            disabled={responding === request.id}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium"
                            style={{ 
                              backgroundColor: responding === request.id ? colors.textSecondary : colors.success,
                              color: 'white'
                            }}
                          >
                            {responding === request.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            <span>{responding === request.id ? 'Approving...' : 'Approve'}</span>
                          </button>
                          
                          <button
                            onClick={() => handleResponse(request.id, 'reject')}
                            disabled={responding === request.id}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium"
                            style={{ 
                              backgroundColor: responding === request.id ? colors.textSecondary : colors.error,
                              color: 'white'
                            }}
                          >
                            {responding === request.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            <span>{responding === request.id ? 'Rejecting...' : 'Reject'}</span>
                          </button>
                        </div>
                      )}
                      
                      {request.status === 'approved' && (
                        <button
                          onClick={async () => {
                            try {
                              const response = await api.post('/management/chat-rooms/get_or_create_for_request/', {
                                request_id: request.id
                              });
                              
                              if (response.data.chat_room) {
                                window.location.hash = '#chats';
                                showToast('Chat room created! Navigate to Chats tab to start messaging.', 'success');
                              }
                            } catch (error) {
                              console.error('Failed to create chat room:', error);
                              showToast('Failed to create chat room. Please try again.', 'error');
                            }
                          }}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium"
                          style={{ 
                            backgroundColor: colors.accent,
                            color: 'white'
                          }}
                        >
                          <MessageCircle size={16} />
                          <span>Open Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'my-requests' && (
        <div>
          {/* My Requests List */}
          <div className="space-y-4">
            {filteredMyRequests.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
                  No requests sent yet
                </h3>
                <p style={{ color: colors.textSecondary }}>
                  You haven't sent any contact requests to manufacturers yet.
                </p>
              </div>
            ) : (
              filteredMyRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-6 transition-all duration-300 hover:shadow-md"
                  style={{ 
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                          {request.business_name}
                        </h3>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-3">
                        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                          <Building size={14} />
                          <span>{request.business_name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                          <Calendar size={14} />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                          <MessageCircle size={14} />
                          <span className="capitalize">{request.request_type} request</span>
                        </div>
                      </div>
                      
                      <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                        {request.message}
                      </p>
                      
                      {request.customer_response && (
                        <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
                          <p className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                            Response:
                          </p>
                          <p className="text-sm" style={{ color: colors.textSecondary }}>
                            {request.customer_response}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => openDetailModal(request)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedRequest && (
          <div 
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              style={{ backgroundColor: colors.cardBg }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                      Contact Request Details
                    </h3>
                    <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {selectedRequest.business_name}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: colors.textSecondary
                    }}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Manufacturer Info */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      {activeTab === 'manufacturer-requests' ? 'Manufacturer Information' : 'Business Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <User size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>
                          {activeTab === 'manufacturer-requests' 
                            ? selectedRequest.manufacturer_name 
                            : selectedRequest.business_name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Mail size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>
                          {activeTab === 'manufacturer-requests' 
                            ? selectedRequest.manufacturer_email 
                            : selectedRequest.business_email}
                        </span>
                      </div>
                      {selectedRequest.manufacturer_company && (
                        <div className="flex items-center">
                          <Building size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>{selectedRequest.manufacturer_company}</span>
                        </div>
                      )}
                      {selectedRequest.manufacturer_location && (
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>{selectedRequest.manufacturer_location}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>
                          {new Date(selectedRequest.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Request Information */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Request Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <MessageCircle size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>
                          Type: {selectedRequest.request_type === 'contact' ? 'Contact Request' : 'Join Business Request'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Status: {selectedRequest.status}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>
                          Sent: {new Date(selectedRequest.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedRequest.responded_at && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>
                            Responded: {new Date(selectedRequest.responded_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Request Message */}
                  <div>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Request Message
                    </h4>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                        {selectedRequest.message}
                      </p>
                    </div>
                  </div>

                  {/* Response Form (for pending requests) */}
                  {selectedRequest.status === 'pending' && activeTab === 'manufacturer-requests' && (
                    <div>
                      <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                        Response Message (Optional)
                      </h4>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={3}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent resize-none"
                        placeholder="Add a response message..."
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.cardBg,
                          color: colors.textPrimary
                        }}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="flex-1 py-3 border rounded-lg transition-colors font-medium"
                      style={{ 
                        borderColor: colors.border,
                        color: colors.textSecondary
                      }}
                    >
                      Close
                    </button>
                    
                    {selectedRequest.status === 'pending' && activeTab === 'manufacturer-requests' && (
                      <>
                        <button
                          onClick={() => handleResponse(selectedRequest.id, 'approve')}
                          disabled={responding === selectedRequest.id}
                          className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                          style={{ 
                            backgroundColor: responding === selectedRequest.id ? colors.textSecondary : colors.success
                          }}
                        >
                          {responding === selectedRequest.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          <span>{responding === selectedRequest.id ? 'Approving...' : 'Approve Request'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleResponse(selectedRequest.id, 'reject')}
                          disabled={responding === selectedRequest.id}
                          className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                          style={{ 
                            backgroundColor: responding === selectedRequest.id ? colors.textSecondary : colors.error
                          }}
                        >
                          {responding === selectedRequest.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          <span>{responding === selectedRequest.id ? 'Rejecting...' : 'Reject Request'}</span>
                        </button>
                      </>
                    )}
                    
                    {selectedRequest.status === 'approved' && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await api.post('/management/chat-rooms/get_or_create_for_request/', {
                              request_id: selectedRequest.id
                            });
                            
                            if (response.data.chat_room) {
                              setShowDetailModal(false);
                              window.location.hash = '#chats';
                              showToast('Chat room created! Navigate to Chats tab to start messaging.', 'success');
                            }
                          } catch (error) {
                            console.error('Failed to create chat room:', error);
                            showToast('Failed to create chat room. Please try again.', 'error');
                          }
                        }}
                        className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                        style={{ 
                          backgroundColor: colors.accent
                        }}
                      >
                        <MessageCircle size={16} />
                        <span>Start Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactRequestManager;