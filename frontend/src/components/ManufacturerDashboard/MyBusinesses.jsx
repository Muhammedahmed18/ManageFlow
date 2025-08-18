import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Package, ShoppingBag, DollarSign, Users, 
  MapPin, Calendar, Eye, EyeOff, Globe, Edit, Trash2,
  Plus, Search, Filter, MessageCircle, Clock, X
} from 'lucide-react';
import colors from '../../assets/colors';
import api from '../../services/authService';
import JoinBusinessModal from './JoinBusinessModal';

const MyBusinesses = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessStats, setBusinessStats] = useState({});
  const [showJoinModal, setShowJoinModal] = useState(false);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/management/manufacturer/businesses/');
      const businessesData = response.data.results || response.data || [];
      setBusinesses(businessesData);
      
      // Extract stats from the response (now included in each business object)
      const stats = {};
      businessesData.forEach(business => {
        if (business.stats) {
          stats[business.id] = business.stats;
        }
      });
      setBusinessStats(stats);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.owner?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.owner?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <Globe className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'rejected':
        return <X className="w-3 h-3" />;
      default:
        return <Building className="w-3 h-3" />;
    }
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
      <div className="relative overflow-hidden rounded-xl mb-6" style={{ background: colors.cardHeaderBg }}>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-white">
              <h1 className="text-2xl font-bold mb-1">My Joined Businesses</h1>
              <p className="text-blue-100 text-sm">
                Manage and monitor your business partnerships
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowJoinModal(true)}
                className="flex items-center px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Join New Business
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.textLight }} />
          <input
            type="text"
            placeholder="Search businesses or customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              color: colors.text
            }}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" style={{ color: colors.textLight }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredBusinesses.length === 0 ? (
          <div className="col-span-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-6 bg-white rounded-xl shadow-lg"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                <Building className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                No joined businesses found
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textLight }}>
                Start by discovering and joining new business opportunities
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowJoinModal(true)}
                className="flex items-center px-4 py-2 mx-auto rounded-lg font-medium transition-all duration-200 shadow-lg"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Discover Businesses
              </motion.button>
            </motion.div>
          </div>
        ) : (
          filteredBusinesses.map((business, index) => {
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
                          <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
                            {business.name || 'Unnamed Business'}
                          </h3>
                          {business.owner && business.owner.username && (
                            <p className="text-xs" style={{ color: colors.textLight }}>
                              Owner: {business.owner.username}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs" style={{ color: colors.textLight }}>
                        {business.location && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {business.location}
                          </span>
                        )}
                        {business.created_at && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(business.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(business.status || 'pending')}`}>
                      {getStatusIcon(business.status || 'pending')}
                      <span className="ml-1">{business.status || 'pending'}</span>
                    </span>
                  </div>

                  {/* Business Stats - Compact */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center justify-center mb-1">
                        <Package className="w-3 h-3 mr-1" style={{ color: colors.primary }} />
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {stats.total_products || 0}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textLight }}>Products</p>
                    </div>
                    
                    <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center justify-center mb-1">
                        <ShoppingBag className="w-3 h-3 mr-1" style={{ color: colors.success }} />
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {stats.total_orders || 0}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textLight }}>Orders</p>
                    </div>
                    
                    <div className="text-center p-2 rounded-lg" style={{ backgroundColor: colors.background }}>
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-3 h-3 mr-1" style={{ color: colors.accent }} />
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          ${(stats.total_revenue || 0).toFixed(0)}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textLight }}>Revenue</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {business.owner && business.owner.username && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
                          <Users className="w-3 h-3 mr-1" />
                          {business.owner.username}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {business.status === 'approved' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/manage/${business.id}`)}
                          className="px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 shadow-sm"
                          style={{ 
                            backgroundColor: colors.primary,
                            color: 'white'
                          }}
                          title="Manage Business"
                        >
                          Manage
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveTab('chats')}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Chat with Customer"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Join Business Modal */}
      <JoinBusinessModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          fetchBusinesses(); // Refresh the businesses list
        }}
      />
    </div>
  );
};

export default MyBusinesses;
