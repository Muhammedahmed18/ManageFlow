import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Edit2, Trash2, Eye, Clock, CheckCircle, XCircle,
  Search, Filter, RefreshCw, AlertCircle, Calendar, DollarSign,
  Package, Users, MessageCircle, MapPin
} from 'lucide-react';
import api from '../../services/authService';
import { colors } from '../../constants/theme';

const ProposalManagement = ({ business, onViewResponses }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState({ primary: [], secondary: [] });
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Form state
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    category: '',
    quantity_needed: '',
    budget_range: '',
    deadline: ''
  });

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/management/customer/proposals/?business=${business.id}`);
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
      // Get business product categories
      const businessCategoriesResponse = await api.get(`/management/product-categories/?business=${business.id}`);
      const businessCategories = businessCategoriesResponse.data.map(cat => cat.name);
      
      // Industry standard categories
      const standardCategories = [
        'Textiles', 'Electronics', 'Food & Beverage', 'Automotive', 
        'Plastics', 'Metal & Steel', 'Wood & Furniture', 'Chemicals',
        'Pharmaceuticals', 'Cosmetics', 'Packaging', 'Machinery',
        'Construction', 'Aerospace', 'Medical Devices', 'Renewable Energy'
      ];
      
      // Filter out categories that business already has
      const secondaryCategories = standardCategories.filter(cat => 
        !businessCategories.includes(cat)
      );
      
      setCategories({
        primary: businessCategories,
        secondary: secondaryCategories
      });
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback to standard categories
      setCategories({
        primary: [],
        secondary: [
          'Textiles', 'Electronics', 'Food & Beverage', 'Automotive', 
          'Plastics', 'Metal & Steel', 'Wood & Furniture', 'Chemicals'
        ]
      });
    }
  };

  const handleAddCustomCategory = async () => {
    if (!customCategory.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }

    try {
      // Add to primary categories (business-specific)
      setCategories(prev => ({
        ...prev,
        primary: [...prev.primary, customCategory.trim()]
      }));
      
      setCustomCategory('');
      setShowCustomCategoryModal(false);
      showToast('Custom category added successfully!', 'success');
    } catch (err) {
      console.error('Error adding custom category:', err);
      showToast('Failed to add custom category', 'error');
    }
  };

  const handleCreateProposal = async () => {
    if (!proposalForm.title.trim() || !proposalForm.description.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/management/proposals/', {
        ...proposalForm,
        business: business.id
      });
      
      setProposals(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      resetForm();
      showToast('Proposal created successfully!', 'success');
    } catch (err) {
      console.error('Error creating proposal:', err);
      showToast('Failed to create proposal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProposal = async () => {
    if (!selectedProposal) return;

    try {
      setSaving(true);
      const response = await api.put(`/management/proposals/${selectedProposal.id}/`, {
        ...proposalForm,
        business: business.id
      });
      
      setProposals(prev => prev.map(p => 
        p.id === selectedProposal.id ? response.data : p
      ));
      setShowEditModal(false);
      setSelectedProposal(null);
      resetForm();
      showToast('Proposal updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating proposal:', err);
      showToast('Failed to update proposal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProposal = async (proposalId) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      await api.delete(`/management/proposals/${proposalId}/`);
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      showToast('Proposal deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting proposal:', err);
      showToast('Failed to delete proposal', 'error');
    }
  };

  const openEditModal = (proposal) => {
    setSelectedProposal(proposal);
    setProposalForm({
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      quantity_needed: proposal.quantity_needed,
      budget_range: proposal.budget_range,
      deadline: proposal.deadline ? proposal.deadline.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const openDetailModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setProposalForm({
      title: '',
      description: '',
      category: '',
      quantity_needed: '',
      budget_range: '',
      deadline: ''
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'inactive': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = filterStatus === 'all' || proposal.is_active === (filterStatus === 'active');
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (business?.id) {
      fetchProposals();
      fetchCategories();
    }
  }, [business?.id]);

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
              Proposals
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.textSecondary }}>
              Create and manage manufacturing proposals for {business?.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.accent, color: 'white' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
            >
              <Plus className="h-4 w-4" />
              <span>Create Proposal</span>
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
                <p className="text-sm" style={{ color: colors.textSecondary }}>Active</p>
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
                <p className="text-sm" style={{ color: colors.textSecondary }}>Responses</p>
                <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                  {proposals.reduce((total, p) => total + (p.responses_count || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8" style={{ color: colors.accent }} />
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
                  {proposals.reduce((total, p) => total + (p.accepted_responses_count || 0), 0)}
                </p>
              </div>
              <MessageCircle className="h-8 w-8" style={{ color: colors.success }} />
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
              placeholder="Search proposals..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search criteria or filters'
                : 'Create your first proposal to start receiving manufacturer responses'
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
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.is_active ? 'active' : 'inactive')}`}>
                      {getStatusIcon(proposal.is_active ? 'active' : 'inactive')}
                      <span>{proposal.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Package size={14} />
                      <span>{proposal.category}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <DollarSign size={14} />
                      <span>{proposal.budget_range}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Users size={14} />
                      <span>{proposal.responses_count || 0} responses</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Calendar size={14} />
                      <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                    {proposal.description}
                  </p>
                </div>
                
                <div className="ml-6 flex items-center space-x-2">
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
                  
                  <button
                    onClick={() => onViewResponses(proposal)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: colors.accent, color: 'white' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                  >
                    <Users size={16} />
                    <span>Responses ({proposal.responses_count || 0})</span>
                  </button>
                  
                  <button
                    onClick={() => openEditModal(proposal)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
                  >
                    <Edit2 size={16} />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteProposal(proposal.id)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: colors.error, color: 'white' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.error}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
                    Create New Proposal
                  </h3>
                  <button 
                    onClick={() => setShowCreateModal(false)}
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
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                      placeholder="e.g., Custom Embroidered Aprons Needed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Category *
                    </label>
                    <div className="space-y-2">
                      <select
                        value={proposalForm.category}
                        onChange={(e) => setProposalForm({...proposalForm, category: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                      >
                        <option value="">Select Category</option>
                        
                        {categories.primary.length > 0 && (
                          <optgroup label="Your Business Categories">
                            {categories.primary.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </optgroup>
                        )}
                        
                        {categories.secondary.length > 0 && (
                          <optgroup label="Other Opportunities">
                            {categories.secondary.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => setShowCustomCategoryModal(true)}
                        className="text-sm px-3 py-1 border rounded-lg transition-colors"
                        style={{ 
                          borderColor: colors.accent,
                          color: colors.accent
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        + Add Custom Category
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Description *
                    </label>
                    <textarea
                      value={proposalForm.description}
                      onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                      placeholder="Describe what you need manufactured..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                        Quantity Needed
                      </label>
                      <input
                        type="text"
                        value={proposalForm.quantity_needed}
                        onChange={(e) => setProposalForm({...proposalForm, quantity_needed: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                        placeholder="e.g., 100-500 units"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                        Budget Range
                      </label>
                      <input
                        type="text"
                        value={proposalForm.budget_range}
                        onChange={(e) => setProposalForm({...proposalForm, budget_range: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                        placeholder="e.g., $5-10 per unit"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={proposalForm.deadline}
                      onChange={(e) => setProposalForm({...proposalForm, deadline: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
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
                    onClick={handleCreateProposal}
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
                      <Plus size={16} />
                    )}
                    <span>{saving ? 'Creating...' : 'Create Proposal'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Proposal Modal */}
      <AnimatePresence>
        {showEditModal && selectedProposal && (
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
                    Edit Proposal
                  </h3>
                  <button 
                    onClick={() => setShowEditModal(false)}
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
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                      placeholder="e.g., Custom Embroidered Aprons Needed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Category *
                    </label>
                    <div className="space-y-2">
                      <select
                        value={proposalForm.category}
                        onChange={(e) => setProposalForm({...proposalForm, category: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                      >
                        <option value="">Select Category</option>
                        
                        {categories.primary.length > 0 && (
                          <optgroup label="Your Business Categories">
                            {categories.primary.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </optgroup>
                        )}
                        
                        {categories.secondary.length > 0 && (
                          <optgroup label="Other Opportunities">
                            {categories.secondary.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => setShowCustomCategoryModal(true)}
                        className="text-sm px-3 py-1 border rounded-lg transition-colors"
                        style={{ 
                          borderColor: colors.accent,
                          color: colors.accent
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = colors.accent}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        + Add Custom Category
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Description *
                    </label>
                    <textarea
                      value={proposalForm.description}
                      onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                      placeholder="Describe what you need manufactured..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                        Quantity Needed
                      </label>
                      <input
                        type="text"
                        value={proposalForm.quantity_needed}
                        onChange={(e) => setProposalForm({...proposalForm, quantity_needed: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                        placeholder="e.g., 100-500 units"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                        Budget Range
                      </label>
                      <input
                        type="text"
                        value={proposalForm.budget_range}
                        onChange={(e) => setProposalForm({...proposalForm, budget_range: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ borderColor: colors.border }}
                        placeholder="e.g., $5-10 per unit"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={proposalForm.deadline}
                      onChange={(e) => setProposalForm({...proposalForm, deadline: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
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
                    onClick={handleEditProposal}
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
                      <Edit2 size={16} />
                    )}
                    <span>{saving ? 'Updating...' : 'Update Proposal'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Category Modal */}
      <AnimatePresence>
        {showCustomCategoryModal && (
          <div 
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-xl w-full max-w-md shadow-2xl"
              style={{ backgroundColor: colors.cardBg }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                    Add Custom Category
                  </h3>
                  <button 
                    onClick={() => setShowCustomCategoryModal(false)}
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
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: colors.border }}
                      placeholder="e.g., Custom Electronics"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => setShowCustomCategoryModal(false)}
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
                    onClick={handleAddCustomCategory}
                    className="flex-1 py-3 text-white rounded-lg transition-colors font-medium"
                    style={{ backgroundColor: colors.accent }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proposal Detail Modal */}
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
                  <div>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      {selectedProposal.title}
                    </h4>
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedProposal.is_active ? 'active' : 'inactive')}`}>
                      {getStatusIcon(selectedProposal.is_active ? 'active' : 'inactive')}
                      <span>{selectedProposal.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                        Created: {new Date(selectedProposal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Description
                    </h4>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                        {selectedProposal.description}
                      </p>
                    </div>
                  </div>

                  {selectedProposal.deadline && (
                    <div>
                      <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                        Deadline
                      </h4>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          {new Date(selectedProposal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Responses ({selectedProposal.responses_count || 0})
                    </h4>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {selectedProposal.responses_count || 0} manufacturer responses received
                      </p>
                      {/* TODO: Add response list here */}
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
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedProposal);
                    }}
                    className="flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                    style={{ backgroundColor: colors.accent }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                  >
                    <Edit2 size={16} />
                    <span>Edit Proposal</span>
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

export default ProposalManagement;
