import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building, Package, Search, Filter, 
  ChevronRight, Plus, X, Loader2, Globe, 
  Mail, MessageCircle, Eye, ShoppingCart, ChevronDown,
  MapPin, Calendar, Phone, ExternalLink, Star,
  TrendingUp, Briefcase, Award, Clock, Filter as FilterIcon,
  Image, Tag, Info, ArrowLeft, ArrowRight
} from 'lucide-react';
import api from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/theme';
import LocationSetupModal from '../shared/LocationSetupModal';
import ProductPreviewModal from '../BusinessManager/ProductPreviewModal';

const DiscoverCustomers = ({ currentUser }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [requestType, setRequestType] = useState('contact');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState('');
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  
  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBusinessForProduct, setSelectedBusinessForProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [businessProducts, setBusinessProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Business overlay state
  const [showBusinessOverlay, setShowBusinessOverlay] = useState(false);
  const [selectedBusinessForOverlay, setSelectedBusinessForOverlay] = useState(null);

  // Request form state
  const [requestForm, setRequestForm] = useState({
    manufacturer_name: '',
    manufacturer_email: '',
    message: ''
  });

  // Location setup state
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [userLocation, setUserLocation] = useState('');
  const [locationChecked, setLocationChecked] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/management/manufacturer/discover-customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const checkUserLocation = async () => {
    try {
      const response = await api.get('/auth/profile/');
      const location = response.data.location;
      setUserLocation(location);
      setLocationChecked(true);
    } catch (error) {
      console.error('Failed to fetch user location:', error);
      setLocationChecked(true);
    }
  };

  const handleRequestSubmit = async () => {
    if (!selectedBusiness) return;
    
    if (!requestForm.manufacturer_name.trim() || !requestForm.manufacturer_email.trim() || !requestForm.message.trim()) {
      setRequestError('Please fill in all required fields');
      return;
    }
    
    setRequestLoading(true);
    setRequestError('');
    
    try {
      const contactData = {
        business_id: selectedBusiness.business_id,
        request_type: 'contact',
        manufacturer_name: requestForm.manufacturer_name,
        manufacturer_email: requestForm.manufacturer_email,
        message: requestForm.message
      };
      
      const response = await api.post('/management/manufacturer/requests/', contactData);
      
      setShowRequestModal(false);
      setSelectedBusiness(null);
      const userName = `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username || '';
      setRequestForm({
        manufacturer_name: userName,
        manufacturer_email: currentUser?.email || '',
        message: ''
      });
      
      showToast(response.data.message, 'success');
    } catch (error) {
      setRequestError(error.response?.data?.detail || 'Failed to send request');
      showToast(error.response?.data?.detail || 'Failed to send request', 'error');
    } finally {
      setRequestLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
    } text-white font-medium flex items-center`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const openRequestModal = async (business, type) => {
    if (!userLocation && locationChecked) {
      setShowLocationSetup(true);
      return;
    }
    
    setSelectedBusiness(business);
    setRequestType(type);
    setShowRequestModal(true);
    setRequestError('');
    
    try {
      const response = await api.get('/auth/profile/');
      const userData = response.data;
      
      const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || '';
      setRequestForm({
        manufacturer_name: userName,
        manufacturer_email: userData.email || '',
        message: ''
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const userName = `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username || '';
      setRequestForm({
        manufacturer_name: userName,
        manufacturer_email: currentUser?.email || '',
        message: ''
      });
    }
  };

  const openInviteCodeModal = (business) => {
    setSelectedBusiness(business);
    setShowInviteCodeModal(true);
    setInviteCode('');
    setInviteCodeError('');
  };

  const handleInviteCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setInviteCodeError('Please enter an invite code');
      return;
    }
    
    setInviteCodeLoading(true);
    setInviteCodeError('');
    
    try {
      const response = await api.post('/business/businesses/link/', {
        invite_code: inviteCode.trim()
      });
      
      setShowInviteCodeModal(false);
      setSelectedBusiness(null);
      setInviteCode('');
      
      showToast('Successfully joined business!', 'success');
    } catch (error) {
      setInviteCodeError(error.response?.data?.detail || 'Invalid invite code');
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const toggleCustomerExpansion = (customerId) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const openProductModal = (business) => {
    setSelectedBusinessForProduct(business);
    setShowProductModal(true);
    
    // Use the products data that's already included in the discovery response
    if (business.products && business.products.length > 0) {
      // Transform the products data to match the expected format
      const transformedProducts = business.products.map(product => ({
        id: product.product_id,
        name: product.product_name,
        image_url: product.product_image,
        category: product.category ? { name: product.category } : null,
        field_values: product.field_values || {},
        created_at: product.created_at
      }));
      setBusinessProducts(transformedProducts);
    } else {
      setBusinessProducts([]);
    }
  };

  const openBusinessOverlay = (business) => {
    setSelectedBusinessForOverlay(business);
    setShowBusinessOverlay(true);
  };

  useEffect(() => {
    fetchCustomers();
    checkUserLocation();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.businesses.some(biz => biz.business_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesIndustry = industryFilter === 'all' || customer.businesses.some(biz => biz.industry === industryFilter);
    const matchesCountry = countryFilter === 'all' || customer.location === countryFilter;
    return matchesSearch && matchesIndustry && matchesCountry;
  });

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent mx-auto" style={{ borderColor: colors.accent, borderTopColor: 'transparent' }} />
        <p className="mt-4 text-sm" style={{ color: colors.textSecondary }}>Loading customers...</p>
      </div>
    );
  }

  return (
    <motion.div
      key="discover"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search 
            className="absolute left-4 top-1/2 transform -translate-y-1/2" 
            size={20} 
            style={{ color: colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Search customers or businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.textPrimary
            }}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary
            }}
          >
            <option value="all">All Industries</option>
            <option value="Textiles">Textiles</option>
            <option value="Electronics">Electronics</option>
            <option value="Food">Food</option>
            <option value="Automotive">Automotive</option>
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
              color: colors.textPrimary
            }}
          >
            <option value="all">All Countries</option>
            <option value="Pakistan">Pakistan</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="China">China</option>
          </select>
        </div>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
          <motion.div
            key={customer.customer_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border overflow-hidden"
            style={{ 
              backgroundColor: colors.cardBg,
              borderColor: colors.border 
            }}
          >
            {/* Customer Header */}
            <div className="p-6 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                    <Users size={24} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
                      {customer.customer_name}
                    </h3>
                    <p style={{ color: colors.textSecondary }}>
                      {customer.customer_email}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm" style={{ color: colors.textSecondary }}>
                      <span className="flex items-center">
                        <Building size={16} className="mr-1" />
                        {customer.total_businesses} businesses
                      </span>
                      <span className="flex items-center">
                        <MapPin size={16} className="mr-1" />
                        <span style={{ color: customer.location ? colors.textSecondary : '#f59e0b' }}>
                          {customer.location || 'Location not set'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleCustomerExpansion(customer.customer_id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: colors.textSecondary
                  }}
                >
                  <ChevronDown 
                    className={`transition-transform ${expandedCustomers.has(customer.customer_id) ? 'rotate-180' : ''}`} 
                    size={24} 
                  />
                </button>
              </div>
            </div>

            {/* Businesses List */}
            <AnimatePresence>
              {expandedCustomers.has(customer.customer_id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div 
                    className="p-6"
                    style={{ backgroundColor: colors.background }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customer.businesses.map((business) => (
                        <div
                          key={business.business_id}
                          className="border rounded-lg p-4 transition-all duration-300 hover:shadow-md"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.cardBg
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 
                              className="font-semibold text-lg transition-colors line-clamp-1"
                              style={{ color: colors.textPrimary }}
                            >
                              {business.business_name}
                            </h4>
                          </div>

                          <div className="space-y-2 mb-3">
                            {business.industry && (
                              <div className="flex items-center text-sm" style={{ color: colors.textSecondary }}>
                                <Building size={14} className="mr-2 flex-shrink-0" />
                                <span className="line-clamp-1">{business.industry}</span>
                              </div>
                            )}
                            {business.location && (
                              <div className="flex items-center text-sm" style={{ color: colors.textSecondary }}>
                                <MapPin size={14} className="mr-2 flex-shrink-0" />
                                <span className="line-clamp-1">{business.location}</span>
                              </div>
                            )}
                            <div 
                              className="flex items-center text-sm cursor-pointer hover:opacity-80 transition-opacity" 
                              style={{ color: colors.textSecondary }}
                              onClick={() => openProductModal(business)}
                            >
                              <Package size={14} className="mr-2 flex-shrink-0" />
                              <span>{business.total_products} products</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-3 border-t" style={{ borderColor: colors.border }}>
                            <button
                              onClick={() => openRequestModal(business, 'contact')}
                              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                              style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
                            >
                              Contact
                            </button>
                            <button
                              onClick={() => openInviteCodeModal(business)}
                              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border"
                              style={{ borderColor: colors.border, color: colors.textPrimary }}
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-16">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Users className="h-12 w-12" style={{ color: colors.textSecondary }} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              No customers found
            </h3>
            <p className="max-w-md mx-auto mb-6" style={{ color: colors.textSecondary }}>
              {searchQuery || industryFilter !== 'all' || countryFilter !== 'all'
                ? 'Try adjusting your search criteria or filters to find more customers'
                : 'No customers are currently available for discovery'
              }
            </p>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-lg w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  Contact {selectedBusiness.business_name}
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={requestForm.manufacturer_name}
                    onChange={(e) => setRequestForm({...requestForm, manufacturer_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: colors.border }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Your Email *
                  </label>
                  <input
                    type="email"
                    value={requestForm.manufacturer_email}
                    onChange={(e) => setRequestForm({...requestForm, manufacturer_email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: colors.border }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Message *
                  </label>
                  <textarea
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: colors.border }}
                    placeholder="Tell them about your manufacturing capabilities, what you manufacture, your experience, and any additional message..."
                  />
                </div>

                {requestError && (
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: colors.error + '10', color: colors.error }}>
                    {requestError}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-2 px-4 rounded-lg border transition-colors"
                    style={{ borderColor: colors.border, color: colors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestSubmit}
                    disabled={requestLoading}
                    className="flex-1 py-2 px-4 rounded-lg transition-colors"
                    style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
                  >
                    {requestLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteCodeModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  Join {selectedBusiness.business_name}
                </h3>
                <button
                  onClick={() => setShowInviteCodeModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Invite Code *
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: colors.border }}
                    placeholder="Enter the invite code provided by the customer"
                  />
                </div>

                {inviteCodeError && (
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: colors.error + '10', color: colors.error }}>
                    {inviteCodeError}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowInviteCodeModal(false)}
                    className="flex-1 py-2 px-4 rounded-lg border transition-colors"
                    style={{ borderColor: colors.border, color: colors.textSecondary }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteCodeSubmit}
                    disabled={inviteCodeLoading}
                    className="flex-1 py-2 px-4 rounded-lg transition-colors"
                    style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
                  >
                    {inviteCodeLoading ? 'Joining...' : 'Join Business'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedBusinessForProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {selectedBusinessForProduct.business_name} - Products
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {businessProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businessProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 transition-all duration-300 hover:shadow-md cursor-pointer"
                      style={{ 
                        borderColor: colors.border,
                        backgroundColor: colors.cardBg
                      }}
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductModal(false);
                      }}
                    >
                      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={32} style={{ color: colors.textSecondary }} />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-1" style={{ color: colors.textPrimary }}>
                        {product.name}
                      </h4>
                      {product.category && (
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {product.category.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Package className="h-12 w-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    No products available for this business
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductPreviewModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          colors={colors}
        />
      )}

      {/* Location Setup Modal */}
      {showLocationSetup && (
        <LocationSetupModal
          isOpen={showLocationSetup}
          onClose={() => setShowLocationSetup(false)}
          onLocationSet={(location) => {
            setUserLocation(location);
            setShowLocationSetup(false);
            // Reopen the request modal after location is set
            if (selectedBusiness) {
              setShowRequestModal(true);
            }
          }}
          currentLocation={userLocation}
        />
      )}
    </motion.div>
  );
};

export default DiscoverCustomers;
