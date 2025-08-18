import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Plus, Edit, Trash2, Eye, EyeOff, Globe, 
  MapPin, Calendar, Users, CheckCircle, XCircle, TrendingUp, 
  TrendingDown, Activity, DollarSign, Package, Clock, Star,
  BarChart3, Target, Zap, ShoppingBag
} from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';
import { AddBusinessModal, EditBusinessModal } from './modals';

const BusinessManager = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    slogan: '',
    location: '',
    is_public: true
  });
  const [userProfile, setUserProfile] = useState(null);
  const [businessStats, setBusinessStats] = useState({});
  
  // New state for modal components
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    slogan: '',
    shipping_country: ''
  });
  const [editBusiness, setEditBusiness] = useState({
    name: '',
    slogan: '',
    shipping_country: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/management/businesses/');
      const businessesData = response.data.map(business => ({
        id: business.id,
        business_name: business.business_name || business.name || 'Unnamed Business',
        slogan: business.slogan || business.description || business.business_description || 'No slogan available',
        location: business.location || business.address || userProfile?.location || 'Location not specified',
        is_public: business.is_public !== undefined ? business.is_public : true,
        created_at: business.created_at || business.created_date || new Date().toISOString(),
        updated_at: business.updated_at || business.modified_date || new Date().toISOString()
      }));
      setBusinesses(businessesData);
      
      // Fetch stats for each business
      await fetchBusinessStats(businessesData);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessStats = async (businessesData) => {
    const stats = {};
    
    for (const business of businessesData) {
      try {
        // Fetch orders for this business
        const ordersResponse = await api.get(`/management/customer/orders/?business=${business.id}`);
        const orders = ordersResponse.data;
        
        // Fetch products for this business
        const productsResponse = await api.get(`/management/products/?business=${business.id}`);
        const products = productsResponse.data;
        
        // Fetch invoices for this business
        const invoicesResponse = await api.get(`/management/invoices/?business=${business.id}`);
        const invoices = invoicesResponse.data;
        
        // Calculate stats
        const totalOrders = orders.length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;
        
        // Calculate revenue from PAID customer invoices (money customer spent)
        const paidInvoices = invoices.filter(invoice => 
          invoice.status?.toLowerCase() === 'paid' && 
          invoice.invoice_type === 'customer'
        );
        const totalRevenue = paidInvoices.reduce((sum, invoice) => {
          const totalAmount = parseFloat(invoice.total_amount) || 0;
          return sum + totalAmount;
        }, 0);
        
        // Debug logging for revenue calculation
        console.log(`Business ${business.business_name} customer revenue calculation:`, {
          businessId: business.id,
          totalRevenue,
          invoicesCount: invoices.length,
          paidCustomerInvoicesCount: paidInvoices.length,
          paidInvoices: paidInvoices.map(inv => ({ 
            id: inv.id, 
            total_amount: inv.total_amount, 
            amount: inv.amount, 
            value: inv.value,
            status: inv.status,
            invoice_type: inv.invoice_type
          }))
        });
        
        const totalProducts = products.length;
        const lastOrderDate = orders.length > 0 ? new Date(Math.max(...orders.map(o => new Date(o.created_at)))) : null;
        const daysSinceLastOrder = lastOrderDate ? Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24)) : null;
        
        stats[business.id] = {
          totalOrders,
          completedOrders,
          totalRevenue,
          totalProducts,
          lastOrderDate,
          daysSinceLastOrder,
          orderCompletionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
        };
      } catch (error) {
        console.warn(`Error fetching stats for business ${business.id}:`, error);
        stats[business.id] = {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          lastOrderDate: null,
          daysSinceLastOrder: null,
          orderCompletionRate: 0
        };
      }
    }
    
    setBusinessStats(stats);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setUserProfile(response.data);
      // Set the location from user profile to form data
      setFormData(prev => ({
        ...prev,
        location: response.data.location || ''
      }));
      // Set shipping country for new business modal
      setNewBusiness(prev => ({
        ...prev,
        shipping_country: response.data.location || ''
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      await fetchBusinesses();
    };
    initializeData();
  }, []);

  // Refetch businesses when userProfile changes to ensure proper location display
  useEffect(() => {
    if (userProfile?.location) {
      fetchBusinesses();
    }
  }, [userProfile]);

  const handleAddBusiness = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});
      
             // Validation
       const newErrors = {};
       if (!newBusiness.name.trim()) {
         newErrors.name = 'Business name is required';
       }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }
      
      // Get user's default visibility setting
      let defaultVisibility = true; // fallback to public
      try {
        const settingsResponse = await api.get('/auth/settings/business/');
        defaultVisibility = settingsResponse.data.default_visibility === 'public';
        console.log('User default visibility setting:', settingsResponse.data.default_visibility, 'Applied:', defaultVisibility);
      } catch (error) {
        console.warn('Could not fetch user settings, using default public visibility');
      }
      
      // Map new business data to API structure
      const businessData = {
        name: newBusiness.name,
        slogan: newBusiness.slogan,
        is_public: defaultVisibility
      };
      
      await api.post('/management/businesses/', businessData);
      setShowAddModal(false);
      setNewBusiness({
        name: '',
        slogan: '',
        shipping_country: userProfile?.location || ''
      });
      setErrors({});
      fetchBusinesses();
    } catch (error) {
      console.error('Error adding business:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to add business. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBusiness = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});
      
             // Validation
       const newErrors = {};
       if (!editBusiness.name.trim()) {
         newErrors.name = 'Business name is required';
       }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }
      
      // Map edit business data to API structure
      const businessData = {
        name: editBusiness.name,
        slogan: editBusiness.slogan,
        is_public: selectedBusiness.is_public
      };
      
      await api.put(`/management/businesses/${selectedBusiness.id}/`, businessData);
      setShowEditModal(false);
      setSelectedBusiness(null);
      setEditBusiness({
        name: '',
        slogan: '',
        shipping_country: ''
      });
      setErrors({});
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Failed to update business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBusiness = async () => {
    try {
      await api.delete(`/management/businesses/${selectedBusiness.id}/`);
      setShowDeleteModal(false);
      setSelectedBusiness(null);
      fetchBusinesses();
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business. Please try again.');
    }
  };

  const handleToggleVisibility = async (businessId, currentVisibility) => {
    try {
      await api.patch(`/management/businesses/${businessId}/`, {
        is_public: !currentVisibility
      });
      fetchBusinesses();
    } catch (error) {
      console.error('Error toggling business visibility:', error);
      alert('Failed to update visibility. Please try again.');
    }
  };

  const openEditModal = (business) => {
    setSelectedBusiness(business);
    setEditBusiness({
      name: business.business_name,
      slogan: business.slogan,
      shipping_country: userProfile?.location || business.location || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (business) => {
    setSelectedBusiness(business);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl mb-6" style={{ backgroundColor: colors.primary }}>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-white">
              <h1 className="text-2xl font-bold mb-1">My Businesses</h1>
              <p className="text-blue-100 text-sm">
                Manage your business profiles and track performance
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </motion.button>
          </div>
        </div>
      </div>

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {businesses.length === 0 ? (
          <div className="col-span-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-6 bg-white rounded-xl shadow-lg"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                <Building className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                No businesses found
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                Get started by adding your first business profile
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 mx-auto rounded-lg font-medium transition-all duration-200 shadow-lg"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Business
              </motion.button>
            </motion.div>
          </div>
        ) : (
          businesses.map((business, index) => {
            const stats = businessStats[business.id] || {};
            return (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Header Bar */}
                <div className="h-1" style={{ backgroundColor: colors.primary }}></div>
                
                <div className="p-4">
                  {/* Business Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-2" style={{ backgroundColor: colors.secondary }}>
                          <Building className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                            {business.business_name}
                          </h3>
                          {business.slogan && (
                            <p className="text-xs" style={{ color: colors.textSecondary }}>
                              {business.slogan}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs" style={{ color: colors.textSecondary }}>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {business.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {business.created_at ? new Date(business.created_at).toLocaleDateString() : 'Date not available'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Visibility Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggleVisibility(business.id, business.is_public)}
                      className={`p-1.5 rounded-full transition-all duration-200 ${
                        business.is_public 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={business.is_public ? 'Public' : 'Private'}
                    >
                      {business.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </motion.button>
                  </div>

                  {/* Business Stats - Compact */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center justify-center mb-1">
                        <Package className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                        <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          {stats.totalProducts || 0}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Products</p>
                    </div>
                    
                    <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center justify-center mb-1">
                        <ShoppingBag className="w-3 h-3 mr-1" style={{ color: colors.success }} />
                        <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          {stats.totalOrders || 0}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Orders</p>
                    </div>
                    
                    <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-3 h-3 mr-1" style={{ color: colors.warning }} />
                        <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                          ${(stats.totalRevenue || 0).toFixed(0)}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Revenue</p>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        business.is_public 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {business.is_public ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/manage/customer/${business.id}`)}
                        className="px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 shadow-sm"
                        style={{ 
                          backgroundColor: colors.primary,
                          color: 'white'
                        }}
                        title="Manage Dashboard"
                      >
                        Manage
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEditModal(business)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openDeleteModal(business)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Business Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddBusinessModal
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            newBusiness={newBusiness}
            setNewBusiness={setNewBusiness}
            errors={errors}
            setErrors={setErrors}
            isSubmitting={isSubmitting}
            handleAddBusiness={handleAddBusiness}
            colors={colors}
          />
        )}
      </AnimatePresence>

      {/* Edit Business Modal */}
      <AnimatePresence>
        {showEditModal && selectedBusiness && (
          <EditBusinessModal
            showEditModal={showEditModal}
            setShowEditModal={setShowEditModal}
            editBusiness={editBusiness}
            setEditBusiness={setEditBusiness}
            errors={errors}
            setErrors={setErrors}
            isSubmitting={isSubmitting}
            handleEditBusiness={handleEditBusiness}
            selectedBusiness={selectedBusiness}
            colors={colors}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedBusiness && (
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
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                  Delete Business
                </h2>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "{selectedBusiness.business_name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteBusiness}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessManager;
