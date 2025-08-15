import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Search, Filter, RefreshCw, AlertCircle, Calendar, DollarSign,
  Package, Users, MapPin, Building, Eye, MessageCircle, Clock, CheckCircle, XCircle,
  Check, X, User, Mail, Phone, ArrowLeft
} from 'lucide-react';
import api from '../../services/authService';
import { colors } from '../../constants/theme';

const ProposalResponseManagement = ({ proposal, onBack }) => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/management/proposals/${proposal.id}/responses/`);
      setResponses(response.data);
    } catch (err) {
      setError('Failed to load responses');
      console.error('Error fetching responses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (responseId, action) => {
    try {
      setProcessing(true);
      await api.patch(`/management/proposals/${proposal.id}/responses/${responseId}/`, {
        action: action
      });
      
      // Update local state
      setResponses(prev => prev.map(response => 
        response.id === responseId 
          ? { ...response, status: action === 'accept' ? 'accepted' : 'rejected' }
          : response
      ));
      
      showToast(`Response ${action}ed successfully!`, 'success');
    } catch (err) {
      console.error('Error updating response status:', err);
      showToast(`Failed to ${action} response`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartChat = async (response) => {
    try {
      setProcessing(true);
      
      // Create or get chat room for this proposal response
      const chatResponse = await api.get(`/management/chat-rooms/get_or_create_for_proposal_response/?response_id=${response.id}`);
      
      // Navigate to the customer dashboard chats tab with the chat room ID
      navigate(`/dashboard/customer#chats?chatId=${chatResponse.data.id}`);
      
      showToast('Chat room created successfully! Redirecting to chat...', 'success');
      
    } catch (err) {
      console.error('Error creating chat room:', err);
      showToast('Failed to create chat room', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDetailModal = (response) => {
    setSelectedResponse(response);
    setShowDetailModal(true);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const filteredResponses = responses.filter(response => {
    const matchesStatus = filterStatus === 'all' || response.status === filterStatus;
    const matchesSearch = response.manufacturer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         response.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (proposal?.id) {
      fetchResponses();
    }
  }, [proposal?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" style={{ color: colors.textSecondary }} />
          <p style={{ color: colors.textSecondary }}>Loading responses...</p>
        </div>
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
            onClick={fetchResponses}
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
              Proposal Responses
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.textSecondary }}>
              Manage responses to "{proposal?.title}"
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.background, color: colors.textPrimary }}
              onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
              onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Proposals</span>
            </button>
            <button
              onClick={fetchResponses}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.background, color: colors.textPrimary }}
              onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
              onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
            >
              <RefreshCw className="h-4 w-4" />
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
                <p className="text-sm" style={{ color: colors.textSecondary }}>Total Responses</p>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {responses.length}
                </p>
              </div>
              <FileText className="h-8 w-8" style={{ color: colors.accent }} />
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
                  {responses.filter(r => r.status === 'pending').length}
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
                <p className="text-sm" style={{ color: colors.textSecondary }}>Accepted</p>
                <p className="text-2xl font-bold" style={{ color: colors.success }}>
                  {responses.filter(r => r.status === 'accepted').length}
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
                  {responses.filter(r => r.status === 'rejected').length}
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
              placeholder="Search manufacturers or responses..."
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
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Responses List */}
      <div className="space-y-4">
        {filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              No responses found
            </h3>
            <p style={{ color: colors.textSecondary }}>
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'No responses have been received for this proposal yet'
              }
            </p>
          </div>
        ) : (
          filteredResponses.map((response, index) => (
            <motion.div
              key={response.id}
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
                      {response.manufacturer_name}
                    </h3>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(response.status)}`}>
                      {getStatusIcon(response.status)}
                      <span>{response.status.charAt(0).toUpperCase() + response.status.slice(1)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <User size={14} />
                      <span>{response.manufacturer_company || 'No company'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <MapPin size={14} />
                      <span>{response.manufacturer_location || 'No location'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <DollarSign size={14} />
                      <span>{response.price_quote || 'No quote'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Calendar size={14} />
                      <span>{new Date(response.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                    {response.message}
                  </p>
                  
                  {response.delivery_time && (
                    <div className="mt-2 flex items-center space-x-2 text-sm" style={{ color: colors.accent }}>
                      <Clock size={14} />
                      <span>Delivery: {response.delivery_time}</span>
                    </div>
                  )}
                </div>
                
                <div className="ml-6 flex items-center space-x-2">
                  <button
                    onClick={() => openDetailModal(response)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  
                  {response.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(response.id, 'accept')}
                        disabled={processing}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: colors.success, color: 'white' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.success}
                      >
                        <Check size={16} />
                        <span>Accept</span>
                      </button>
                      
                      <button
                        onClick={() => handleStatusUpdate(response.id, 'reject')}
                        disabled={processing}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: colors.error, color: 'white' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.error}
                      >
                        <X size={16} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  
                  {response.status === 'accepted' && (
                    <button
                      onClick={() => handleStartChat(response)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: colors.accent, color: 'white' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                    >
                      <MessageCircle size={16} />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Response Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedResponse && (
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
                  <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                    Response Details
                  </h3>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: colors.textSecondary
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Manufacturer Information */}
                  <div>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Manufacturer Information
                    </h4>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <User size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>Name: {selectedResponse.manufacturer_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Building size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>Company: {selectedResponse.manufacturer_company || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>Email: {selectedResponse.manufacturer_email}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>Location: {selectedResponse.manufacturer_location || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Response Details */}
                  <div>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Response Details
                    </h4>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>Price Quote: {selectedResponse.price_quote || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>Delivery Time: {selectedResponse.delivery_time || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                          <span style={{ color: colors.textSecondary }}>
                            Submitted: {new Date(selectedResponse.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedResponse.status)}`}>
                            {getStatusIcon(selectedResponse.status)}
                            <span>{selectedResponse.status.charAt(0).toUpperCase() + selectedResponse.status.slice(1)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Message</h5>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                          {selectedResponse.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 py-3 border rounded-lg transition-colors font-medium"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.textSecondary
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Close
                  </button>
                  
                  {selectedResponse.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedResponse.id, 'accept');
                          setShowDetailModal(false);
                        }}
                        disabled={processing}
                        className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                        style={{ backgroundColor: colors.success }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.success}
                      >
                        <Check size={16} />
                        <span>Accept Response</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedResponse.id, 'reject');
                          setShowDetailModal(false);
                        }}
                        disabled={processing}
                        className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                        style={{ backgroundColor: colors.error }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.error}
                      >
                        <X size={16} />
                        <span>Reject Response</span>
                      </button>
                    </>
                  )}
                  
                  {selectedResponse.status === 'accepted' && (
                    <button
                      onClick={() => {
                        handleStartChat(selectedResponse);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                      style={{ backgroundColor: colors.accent }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                    >
                      <MessageCircle size={16} />
                      <span>Start Chat</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposalResponseManagement;
