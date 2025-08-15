import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Mail, Building, User, Filter, X, Eye, 
  MessageCircle, Phone, Globe, ChevronRight, 
  Calendar, ExternalLink, Star, TrendingUp, Briefcase, 
  Award, Clock, Filter as FilterIcon, Image, Tag, Info
} from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import api from '../../services/authService';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const CustomerManufacturerDiscovery = () => {
  const { currentUser } = useAuth();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    customer_name: '',
    customer_email: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/management/customer/manufacturers/');
      setManufacturers(response.data);
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatic fetch on component mount
  useEffect(() => {
    fetchManufacturers();
  }, []);

  const filteredManufacturers = manufacturers.filter(manufacturer => {
    const matchesSearch = manufacturer.get_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manufacturer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manufacturer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
                           manufacturer.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  const openDetailModal = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedManufacturer(null);
  };

  const openContactModal = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    // Auto-fill with current user data
    const fullName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : '';
    setContactForm({
      customer_name: fullName,
      customer_email: currentUser?.email || '',
      message: ''
    });
    setContactError('');
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setSelectedManufacturer(null);
    setContactForm({
      customer_name: '',
      customer_email: '',
      message: ''
    });
    setContactError('');
  };

  const handleContactSubmit = async () => {
    if (!selectedManufacturer) return;
    
    if (!contactForm.customer_name.trim() || !contactForm.customer_email.trim() || !contactForm.message.trim()) {
      setContactError('Please fill in all required fields');
      return;
    }
    
    setContactLoading(true);
    setContactError('');
    
    try {
      // Send contact request to the backend
      const contactData = {
        business_id: selectedManufacturer.business_id,
        request_type: 'contact',
        manufacturer_name: contactForm.customer_name,
        manufacturer_email: contactForm.customer_email,
        message: contactForm.message
      };
      
      await api.post('/management/manufacturer/requests/', contactData);
      
      closeContactModal();
      // Show success message
      alert('Contact request sent successfully!');
    } catch (error) {
      console.error('Error sending contact request:', error);
      setContactError('Failed to send contact request. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <LoadingSpinner size="lg" text="Loading manufacturers..." />
      </div>
    );
  }

  return (
    <motion.div
      key="manufacturers"
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
            placeholder="Search manufacturers by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.textPrimary
            }}
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
              showFilters ? 'shadow-sm' : 'hover:bg-white/50'
            }`}
            style={{ 
              borderColor: colors.border,
              backgroundColor: showFilters ? colors.cardBg : 'transparent',
              color: showFilters ? colors.primary : colors.textSecondary
            }}
          >
            <FilterIcon size={16} />
            <span>Filters</span>
          </button>
          
          {(searchTerm || locationFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium"
              style={{ 
                borderColor: colors.border,
                color: colors.textSecondary
              }}
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-lg border"
            style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                  style={{ 
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          Discover Manufacturers
        </h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {filteredManufacturers.length} manufacturer{filteredManufacturers.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Manufacturers Grid */}
      {filteredManufacturers.length === 0 ? (
        <div className="text-center py-16">
          <Building size={48} style={{ color: colors.textSecondary }} className="mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
            No manufacturers found
          </h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Try adjusting your search terms or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManufacturers.map((manufacturer) => (
            <motion.div
              key={manufacturer.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all"
              style={{ borderColor: colors.border }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" style={{ color: colors.textPrimary }}>
                      {manufacturer.get_full_name || 'N/A'}
                    </h3>
                    {manufacturer.company_name && (
                      <p className="text-sm font-medium" style={{ color: colors.accent }}>
                        {manufacturer.company_name}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: colors.accent + '20' }}>
                    <User size={20} style={{ color: colors.accent }} />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Mail size={14} style={{ color: colors.textSecondary }} />
                    <span className="text-sm" style={{ color: colors.textPrimary }}>
                      {manufacturer.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} style={{ color: colors.textSecondary }} />
                    <span className="text-sm" style={{ color: colors.textPrimary }}>
                      {manufacturer.location || 'Location not set'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => openDetailModal(manufacturer)}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.textSecondary,
                      border: `1px solid ${colors.border}`
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = colors.border}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.background}
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  
                  <button
                    onClick={() => openContactModal(manufacturer)}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    style={{ 
                      backgroundColor: colors.accent,
                      color: 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                  >
                    <MessageCircle size={16} />
                    <span>Contact</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Manufacturer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedManufacturer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      {selectedManufacturer.get_full_name || 'N/A'}
                    </h3>
                    {selectedManufacturer.company_name && (
                      <p className="text-lg font-medium" style={{ color: colors.accent }}>
                        {selectedManufacturer.company_name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} style={{ color: colors.textSecondary }} />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                      Email
                    </label>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {selectedManufacturer.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                      Location
                    </label>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {selectedManufacturer.location || 'Location not set'}
                    </p>
                  </div>



                  {selectedManufacturer.description && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                        Description
                      </label>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>
                        {selectedManufacturer.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="flex-1 py-2 px-4 border rounded-lg transition-colors font-medium"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.textSecondary
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal();
                      openContactModal(selectedManufacturer);
                    }}
                    className="flex-1 py-2 px-4 text-white rounded-lg transition-colors font-medium"
                    style={{ backgroundColor: colors.accent }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                  >
                    Contact
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && selectedManufacturer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-md w-full"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                      Contact {selectedManufacturer.get_full_name}
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Send a message to this manufacturer
                    </p>
                  </div>
                  <button
                    onClick={closeContactModal}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} style={{ color: colors.textSecondary }} />
                  </button>
                </div>

                {/* Contact Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={contactForm.customer_name}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg transition-all bg-gray-50 cursor-not-allowed"
                      style={{ 
                        borderColor: colors.border,
                        color: colors.textSecondary
                      }}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Your Email *
                    </label>
                    <input
                      type="email"
                      value={contactForm.customer_email}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg transition-all bg-gray-50 cursor-not-allowed"
                      style={{ 
                        borderColor: colors.border,
                        color: colors.textSecondary
                      }}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Message *
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                      style={{ 
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        color: colors.textPrimary
                      }}
                      placeholder="Describe your manufacturing needs or inquiry..."
                    />
                  </div>

                  {contactError && (
                    <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: colors.error + '10', color: colors.error }}>
                      {contactError}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={closeContactModal}
                    className="flex-1 py-2 px-4 border rounded-lg transition-colors font-medium"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.textSecondary
                    }}
                    disabled={contactLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContactSubmit}
                    disabled={contactLoading}
                    className="flex-1 py-2 px-4 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                    style={{ 
                      backgroundColor: contactLoading ? colors.textSecondary : colors.accent
                    }}
                    onMouseEnter={(e) => {
                      if (!contactLoading) {
                        e.target.style.backgroundColor = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!contactLoading) {
                        e.target.style.backgroundColor = colors.accent;
                      }
                    }}
                  >
                    {contactLoading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" showText={false} />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle size={16} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomerManufacturerDiscovery;
