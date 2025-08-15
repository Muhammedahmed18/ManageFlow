import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Filter, RefreshCw, AlertCircle, Calendar, DollarSign,
  Package, Users, MapPin, Building, Eye, MessageCircle, Clock, CheckCircle, XCircle
} from 'lucide-react';
import api from '../../services/authService';
import { colors } from '../../constants/theme';

const ProposalDiscovery = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Response form state
  const [responseForm, setResponseForm] = useState({
    message: '',
    price_quote: '',
    delivery_time: ''
  });

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await api.get(`/management/manufacturer/proposals/?${params.toString()}`);
      setProposals(response.data);
    } catch (err) {
      setError('Failed to load proposals');
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Get unique categories from proposals
      const response = await api.get('/management/manufacturer/proposals/');
      const uniqueCategories = [...new Set(response.data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseForm.message.trim()) {
      showToast('Please provide a response message', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/management/proposal-responses/', {
        proposal: selectedProposal.id,
        message: responseForm.message,
        price_quote: responseForm.price_quote || null,
        delivery_time: responseForm.delivery_time
      });
      
      setShowResponseModal(false);
      setSelectedProposal(null);
      resetResponseForm();
      showToast('Response submitted successfully!', 'success');
      
      // Refresh proposals to update response count
      fetchProposals();
    } catch (err) {
      console.error('Error submitting response:', err);
      showToast('Failed to submit response', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openResponseModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowResponseModal(true);
    resetResponseForm();
  };

  const openDetailModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const resetResponseForm = () => {
    setResponseForm({
      message: '',
      price_quote: '',
      delivery_time: ''
    });
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

  const filteredProposals = proposals.filter(proposal => {
    const matchesCategory = filterCategory === 'all' || proposal.category === filterCategory;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    fetchProposals();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [filterCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" style={{ color: colors.textSecondary }} />
          <p style={{ color: colors.textSecondary }}>Loading proposals...</p>
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
            onClick={fetchProposals}
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
              Proposal Discovery
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.textSecondary }}>
              Browse and respond to manufacturing proposals from customers
            </p>
          </div>
          <button
            onClick={fetchProposals}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.background, color: colors.textPrimary }}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
            onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Total Proposals</p>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {proposals.length}
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
                <p className="text-sm" style={{ color: colors.textSecondary }}>Available</p>
                <p className="text-2xl font-bold" style={{ color: colors.success }}>
                  {proposals.filter(p => p.is_active).length}
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
                <p className="text-sm" style={{ color: colors.textSecondary }}>Categories</p>
                <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                  {categories.length}
                </p>
              </div>
              <Package className="h-8 w-8" style={{ color: colors.accent }} />
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Businesses</p>
                <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                  {new Set(proposals.map(p => p.business_name)).size}
                </p>
              </div>
              <Building className="h-8 w-8" style={{ color: colors.accent }} />
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
              placeholder="Search proposals, businesses, or descriptions..."
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              No proposals found
            </h3>
            <p style={{ color: colors.textSecondary }}>
              {searchQuery || filterCategory !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'No active proposals are currently available'
              }
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
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
                      {proposal.title}
                    </h3>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      proposal.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {proposal.is_active ? <CheckCircle size={14} /> : <Clock size={14} />}
                      <span>{proposal.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Building size={14} />
                      <span>{proposal.business_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Package size={14} />
                      <span>{proposal.category}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <DollarSign size={14} />
                      <span>{proposal.budget_range}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Calendar size={14} />
                      <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                    {proposal.description}
                  </p>
                  
                  {proposal.deadline && (
                    <div className="mt-2 flex items-center space-x-2 text-sm" style={{ color: colors.warning }}>
                      <Clock size={14} />
                      <span>Deadline: {new Date(proposal.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="ml-6 flex items-center space-x-2">
                  {proposal.has_responded ? (
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-lg"
                         style={{ backgroundColor: colors.success, color: 'white' }}>
                      <CheckCircle size={16} />
                      <span>Responded</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => openDetailModal(proposal)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                        onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      
                      {proposal.is_active && (
                        <button
                          onClick={() => openResponseModal(proposal)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                          style={{ backgroundColor: colors.accent, color: 'white' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                        >
                          <MessageCircle size={16} />
                          <span>Respond</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedProposal && (
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
                    Proposal Details
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
                  {/* Proposal Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <h4 className="text-lg font-medium" style={{ color: colors.textPrimary }}>
                      {selectedProposal.title}
                    </h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      selectedProposal.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {selectedProposal.is_active ? <CheckCircle size={14} /> : <Clock size={14} />}
                      <span>{selectedProposal.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  {/* Proposal Information */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center">
                        <Building size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Business: {selectedProposal.business_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Package size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Category: {selectedProposal.category}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Budget: {selectedProposal.budget_range}</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Quantity: {selectedProposal.quantity_needed}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>
                          Posted: {new Date(selectedProposal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedProposal.deadline && (
                        <div className="flex items-center">
                          <Clock size={14} className="mr-2" style={{ color: colors.warning }} />
                          <span style={{ color: colors.warning }}>Deadline: {new Date(selectedProposal.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2" style={{ color: colors.textPrimary }}>Description</h5>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                        {selectedProposal.description}
                      </p>
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
                  
                  {selectedProposal.is_active && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openResponseModal(selectedProposal);
                      }}
                      className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                      style={{ backgroundColor: colors.accent }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                    >
                      <MessageCircle size={16} />
                      <span>Respond to Proposal</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedProposal && (
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
                    Respond to Proposal
                  </h3>
                  <button 
                    onClick={() => setShowResponseModal(false)}
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
                  {/* Proposal Summary */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      {selectedProposal.title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <Building size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>{selectedProposal.business_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Package size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>{selectedProposal.category}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Budget: {selectedProposal.budget_range}</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2" style={{ color: colors.textSecondary }} />
                        <span style={{ color: colors.textSecondary }}>Quantity: {selectedProposal.quantity_needed}</span>
                      </div>
                    </div>
                    <p className="text-sm mt-3" style={{ color: colors.textSecondary }}>
                      {selectedProposal.description}
                    </p>
                  </div>

                  {/* Response Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                        Your Response Message *
                      </label>
                      <textarea
                        value={responseForm.message}
                        onChange={(e) => setResponseForm({...responseForm, message: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                        placeholder="Describe how you can fulfill this proposal, your capabilities, experience, etc..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                          Price Quote (Optional)
                        </label>
                        <input
                          type="text"
                          value={responseForm.price_quote}
                          onChange={(e) => setResponseForm({...responseForm, price_quote: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          style={{ borderColor: colors.border }}
                          placeholder="e.g., $8 per unit"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                          Delivery Time (Optional)
                        </label>
                        <input
                          type="text"
                          value={responseForm.delivery_time}
                          onChange={(e) => setResponseForm({...responseForm, delivery_time: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          style={{ borderColor: colors.border }}
                          placeholder="e.g., 2-3 weeks"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 py-3 border rounded-lg transition-colors font-medium"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.textSecondary
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={saving}
                    className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                    style={{ 
                      backgroundColor: saving ? colors.textSecondary : colors.accent
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
                        e.target.style.backgroundColor = colors.accent;
                      }
                    }}
                  >
                    {saving ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                    <span>{saving ? 'Submitting...' : 'Submit Response'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposalDiscovery;
