import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, Building, Package, MapPin, 
  Globe, Lock, Settings, RefreshCw, AlertCircle,
  CheckCircle, XCircle
} from 'lucide-react';
import api from '../../services/authService';
import { colors } from '../../constants/theme';

const BusinessVisibilityManager = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingBusiness, setUpdatingBusiness] = useState(null);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/business/customer/businesses/visibility/');
      setBusinesses(response.data);
    } catch (err) {
      setError('Failed to load businesses');
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (businessId, currentStatus) => {
    try {
      setUpdatingBusiness(businessId);
      const response = await api.patch(`/business/customer/businesses/visibility/${businessId}/`, {
        is_public: !currentStatus
      });
      
      // Update the local state
      setBusinesses(prev => prev.map(business => 
        business.business_id === businessId 
          ? { ...business, is_public: !currentStatus }
          : business
      ));
      
      // Show success message
      showToast(response.data.message, 'success');
    } catch (err) {
      setError('Failed to update business visibility');
      console.error('Error updating business visibility:', err);
      showToast('Failed to update business visibility', 'error');
    } finally {
      setUpdatingBusiness(null);
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

  useEffect(() => {
    fetchBusinesses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" style={{ color: colors.textSecondary }} />
          <p style={{ color: colors.textSecondary }}>Loading businesses...</p>
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
            onClick={fetchBusinesses}
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Business Visibility Management
            </h1>
            <p className="text-lg mt-2" style={{ color: colors.textSecondary }}>
              Control which businesses are visible to manufacturers in the discovery page
            </p>
          </div>
          <button
            onClick={fetchBusinesses}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Total Businesses</p>
                <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {businesses.length}
                </p>
              </div>
              <Building className="h-8 w-8" style={{ color: colors.accent }} />
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Public Businesses</p>
                <p className="text-2xl font-bold" style={{ color: colors.success }}>
                  {businesses.filter(b => b.is_public).length}
                </p>
              </div>
              <Eye className="h-8 w-8" style={{ color: colors.success }} />
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Private Businesses</p>
                <p className="text-2xl font-bold" style={{ color: colors.warning }}>
                  {businesses.filter(b => !b.is_public).length}
                </p>
              </div>
              <EyeOff className="h-8 w-8" style={{ color: colors.warning }} />
            </div>
          </div>
        </div>
      </div>

      {/* Businesses List */}
      <div className="space-y-4">
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              No businesses found
            </h3>
            <p style={{ color: colors.textSecondary }}>
              You haven't created any businesses yet.
            </p>
          </div>
        ) : (
          businesses.map((business, index) => (
            <motion.div
              key={business.business_id}
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
                      {business.business_name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {business.is_public ? (
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <Eye size={12} />
                          <span>Public</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <EyeOff size={12} />
                          <span>Private</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <MapPin size={14} />
                      <span>{business.shipping_country}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                      <Package size={14} />
                      <span>{business.total_products} products</span>
                    </div>
                    
                    {business.industry && (
                      <div className="flex items-center space-x-2" style={{ color: colors.textSecondary }}>
                        <Building size={14} />
                        <span>{business.industry}</span>
                      </div>
                    )}
                  </div>
                  
                  {business.description && (
                    <p className="text-sm mt-3 line-clamp-2" style={{ color: colors.textSecondary }}>
                      {business.description}
                    </p>
                  )}
                </div>
                
                <div className="ml-6">
                  <button
                    onClick={() => toggleVisibility(business.business_id, business.is_public)}
                    disabled={updatingBusiness === business.business_id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                      updatingBusiness === business.business_id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ 
                      backgroundColor: business.is_public ? colors.warning : colors.success,
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      if (updatingBusiness !== business.business_id) {
                        e.target.style.backgroundColor = business.is_public ? '#d97706' : '#059669';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (updatingBusiness !== business.business_id) {
                        e.target.style.backgroundColor = business.is_public ? colors.warning : colors.success;
                      }
                    }}
                  >
                    {updatingBusiness === business.business_id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : business.is_public ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span>
                      {updatingBusiness === business.business_id 
                        ? 'Updating...' 
                        : business.is_public 
                          ? 'Make Private' 
                          : 'Make Public'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: colors.background }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          How it works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <Eye className="h-5 w-5 mt-0.5" style={{ color: colors.success }} />
            <div>
              <h4 className="font-medium mb-1" style={{ color: colors.textPrimary }}>Public Businesses</h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Visible to all manufacturers in the discovery page. Manufacturers can see your business details and products.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <EyeOff className="h-5 w-5 mt-0.5" style={{ color: colors.warning }} />
            <div>
              <h4 className="font-medium mb-1" style={{ color: colors.textPrimary }}>Private Businesses</h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Hidden from manufacturer discovery. Only you and approved manufacturers can see these businesses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessVisibilityManager;


