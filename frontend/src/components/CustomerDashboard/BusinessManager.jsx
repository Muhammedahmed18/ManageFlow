import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Plus, Edit, Trash2, Eye, EyeOff, Globe, 
  MapPin, Calendar, Users, CheckCircle, XCircle
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
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
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
            My Businesses
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage your business profiles and visibility settings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Business
        </button>
      </div>

      {/* Business Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No businesses found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first business profile
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Business
            </button>
          </div>
        ) : (
          businesses.map((business, index) => (
            <motion.div
              key={business.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                                         <h3 className="font-semibold text-gray-900 mb-1">
                       {business.business_name} {business.slogan && `(${business.slogan})`}
                     </h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleVisibility(business.id, business.is_public)}
                      className={`p-2 rounded-full transition-colors ${
                        business.is_public 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={business.is_public ? 'Public' : 'Private'}
                    >
                      {business.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/manage/customer/${business.id}`)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      title="Manage Dashboard"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => openEditModal(business)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(business)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
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
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Delete Business</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedBusiness.business_name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBusiness}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessManager;
