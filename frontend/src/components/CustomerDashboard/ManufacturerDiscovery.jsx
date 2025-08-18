import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, MapPin, Star, Building, 
  MessageCircle, ExternalLink, Plus, Globe, Factory, Eye
} from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';
import { ContactRequestForm } from './modals';

const ManufacturerDiscovery = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [manufacturers, setManufacturers] = useState([]);
  const [joinedManufacturers, setJoinedManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormManufacturer, setContactFormManufacturer] = useState(null);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/management/customer/manufacturers/');
      console.log('Manufacturers API response:', response.data);
      
      const manufacturersData = response.data.map(manufacturer => {
        console.log('Processing manufacturer:', manufacturer);
        return {
          id: manufacturer.id,
          business_name: manufacturer.get_full_name || manufacturer.company_name || 'Unnamed Manufacturer',
          description: manufacturer.description || 'No description available',
          location: manufacturer.location || manufacturer.company_name || 'Global',
          industry: manufacturer.company_name || 'General Manufacturing',
          rating: 4.5, // Default rating since backend doesn't provide it
          contact_person: manufacturer.get_full_name || 'Not specified',
          phone: manufacturer.phone || 'Not specified',
          email: manufacturer.email || 'Not specified',
          website: '',
          capabilities: [],
          certifications: [],
          years_experience: 0,
          is_public: true, // Default to public since backend doesn't provide this
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      setManufacturers(manufacturersData);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedManufacturers = async () => {
    try {
      const response = await api.get('/management/customer/business-manufacturer/');
      console.log('Joined manufacturers API response:', response.data);
      const joinedData = [];
      
      // Process the response to extract joined manufacturers
      if (response.data.approved_manufacturer) {
        const manufacturer = response.data.approved_manufacturer;
        const fullName = `${manufacturer.first_name || ''} ${manufacturer.last_name || ''}`.trim() || manufacturer.username || 'Unknown Manufacturer';
        
        joinedData.push({
          id: manufacturer.id,
          business_name: fullName,
          description: 'Approved manufacturer for this business',
          location: manufacturer.location || manufacturer.company_name || 'Global',
          industry: manufacturer.company_name || 'General Manufacturing',
          status: 'approved',
          business_name_joined: response.data.business_name,
          joined_date: new Date().toISOString(),
          relationship_type: 'Approved Manufacturer'
        });
      }
      
      // Add pending manufacturers
      if (response.data.pending_manufacturers) {
        response.data.pending_manufacturers.forEach(manufacturer => {
          const fullName = `${manufacturer.first_name || ''} ${manufacturer.last_name || ''}`.trim() || manufacturer.username || 'Unknown Manufacturer';
          
          joinedData.push({
            id: manufacturer.id,
            business_name: fullName,
            description: 'Pending approval for this business',
            location: manufacturer.location || manufacturer.company_name || 'Global',
            industry: manufacturer.company_name || 'General Manufacturing',
            status: 'pending',
            business_name_joined: response.data.business_name,
            joined_date: new Date().toISOString(),
            relationship_type: 'Pending Approval'
          });
        });
      }
      
      setJoinedManufacturers(joinedData);
    } catch (error) {
      console.error('Error fetching joined manufacturers:', error);
      setJoinedManufacturers([]);
    }
  };

  useEffect(() => {
    fetchManufacturers();
    fetchJoinedManufacturers();
  }, []);

  const handleContactRequest = (manufacturer) => {
    setContactFormManufacturer(manufacturer);
    setShowContactForm(true);
    setShowDetailModal(false); // Close detail modal if open
  };

  const handleContactRequestSuccess = (response) => {
    // Show success message
    alert('Contact request sent successfully! The manufacturer will be notified.');
    // Optionally refresh the manufacturers list or update UI
  };

  const filterManufacturers = () => {
    return manufacturers.filter(manufacturer => {
      const matchesSearch = manufacturer.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manufacturer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manufacturer.industry.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || 
                             manufacturer.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesIndustry = !industryFilter || 
                             manufacturer.industry.toLowerCase().includes(industryFilter.toLowerCase());
      
      const matchesRating = !ratingFilter || 
                           manufacturer.rating >= parseFloat(ratingFilter);
      
      return matchesSearch && matchesLocation && matchesIndustry && matchesRating;
    });
  };

  const filteredManufacturers = filterManufacturers();

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
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
            Manufacturers
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {activeTab === 'discover' 
              ? 'Find and connect with manufacturing partners worldwide'
              : 'Manage manufacturers who have joined your business'
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'discover'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Discover Manufacturers</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('joined')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'joined'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Joined Manufacturers</span>
            {joinedManufacturers.filter(m => m.status === 'pending').length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {joinedManufacturers.filter(m => m.status === 'pending').length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Search and Filters - Only show for discover tab */}
      {activeTab === 'discover' && (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {Array.from(new Set(manufacturers.map(m => m.location))).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Industries</option>
              {Array.from(new Set(manufacturers.map(m => m.industry))).map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'discover' ? (
        <>
          {/* Discover Manufacturers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredManufacturers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No manufacturers found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || locationFilter || industryFilter || ratingFilter
                    ? 'Try adjusting your search or filter criteria'
                    : 'No manufacturers are currently available.'
                  }
                </p>
              </div>
            ) : (
              filteredManufacturers.map((manufacturer, index) => (
                <motion.div
                  key={manufacturer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {manufacturer.business_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {manufacturer.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        {manufacturer.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Factory className="w-4 h-4 mr-2" />
                        {manufacturer.industry}
                      </div>
                      {manufacturer.years_experience > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Building className="w-4 h-4 mr-2" />
                          {manufacturer.years_experience} years experience
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {manufacturer.is_public && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedManufacturer(manufacturer);
                            setShowDetailModal(true);
                          }}
                          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Joined Manufacturers List */}
          <div className="space-y-4">
            {joinedManufacturers.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No joined manufacturers
                </h3>
                <p className="text-gray-500">
                  Manufacturers who join your business will appear here.
                </p>
              </div>
            ) : (
              joinedManufacturers.map((manufacturer, index) => (
                <motion.div
                  key={manufacturer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {manufacturer.business_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {manufacturer.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            Joined: {manufacturer.business_name_joined}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {manufacturer.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          manufacturer.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {manufacturer.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Relationship:</span> {manufacturer.relationship_type}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedManufacturer(manufacturer);
                            setShowDetailModal(true);
                          }}
                          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {/* Manufacturer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedManufacturer && (
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
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedManufacturer.business_name}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedManufacturer.location}
                      </span>
                      <span className="flex items-center">
                        <Factory className="w-4 h-4 mr-1" />
                        {selectedManufacturer.industry}
                      </span>
                      {selectedManufacturer.years_experience > 0 && (
                        <span className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {selectedManufacturer.years_experience} years
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                    <p className="text-gray-600 mb-4">
                      {selectedManufacturer.description}
                    </p>
                    


                    {selectedManufacturer.capabilities && selectedManufacturer.capabilities.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Capabilities</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedManufacturer.capabilities.map((capability, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedManufacturer.certifications && selectedManufacturer.certifications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedManufacturer.certifications.map((cert, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                        <p className="text-sm text-gray-900">{selectedManufacturer.contact_person}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{selectedManufacturer.email}</p>
                      </div>
                      {selectedManufacturer.website && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <a
                            href={selectedManufacturer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                          >
                            {selectedManufacturer.website}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => handleContactRequest(selectedManufacturer)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Contact Request
                      </button>
                      
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Request Form Modal */}
      <ContactRequestForm
        isOpen={showContactForm}
        onClose={() => {
          setShowContactForm(false);
          setContactFormManufacturer(null);
        }}
        manufacturer={contactFormManufacturer}
        onSuccess={handleContactRequestSuccess}
      />
    </div>
  );
};

export default ManufacturerDiscovery;
