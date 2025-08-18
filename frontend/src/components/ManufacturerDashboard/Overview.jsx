import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building, Package, ShoppingCart, Award, 
  TrendingUp, Star, BarChart3, Plus, MessageCircle, Search
} from 'lucide-react';
import { colors } from '../../constants/theme';

const Overview = ({ 
  stats,
  setActiveTab
}) => {
  // Provide default values if stats is null or undefined
  const safeStats = stats || {
    totalCustomers: 0,
    totalBusinesses: 0,
    totalProducts: 0,
    totalOrders: 0,
    approvedCustomers: 0,
    activeCustomers: 0,
    pendingRequests: 0,
    totalRequests: 0
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.accent}20` }}
            >
              <Users className="h-6 w-6" style={{ color: colors.accent }} />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
              Total Customers
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {safeStats.totalCustomers}
            </p>
            <div className="flex items-center text-sm" style={{ color: colors.success }}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.success}20` }}
            >
              <Building className="h-6 w-6" style={{ color: colors.success }} />
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
              Active Businesses
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {safeStats.totalBusinesses}
            </p>
            <div className="flex items-center text-sm" style={{ color: colors.success }}>
              <Building className="w-4 h-4 mr-1" />
              <span>{safeStats.approvedCustomers} approved</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.warning}20` }}
            >
              <Package className="h-6 w-6" style={{ color: colors.warning }} />
            </div>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
              Total Products
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {safeStats.totalProducts}
            </p>
            <div className="flex items-center text-sm" style={{ color: colors.textSecondary }}>
              <Package className="w-4 h-4 mr-1" />
              <span>Across all businesses</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="group relative bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <ShoppingCart className="h-6 w-6" style={{ color: colors.primary }} />
            </div>
            <Award className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
              Total Orders
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {safeStats.totalOrders}
            </p>
            <div className="flex items-center text-sm" style={{ color: colors.success }}>
              <ShoppingCart className="w-4 h-4 mr-1" />
              <span>Processing orders</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border p-6"
          style={{ borderColor: colors.border }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('businesses')}
              className="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.background
              }}
            >
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Plus className="h-5 w-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    Join New Business
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Connect with potential customers
                  </p>
                </div>
              </div>
              <TrendingUp className="h-5 w-5" style={{ color: colors.textSecondary }} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('chats')}
              className="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.background
              }}
            >
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.success}20` }}
                >
                  <MessageCircle className="h-5 w-5" style={{ color: colors.success }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    View Messages
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Check customer communications
                  </p>
                </div>
              </div>
              <MessageCircle className="h-5 w-5" style={{ color: colors.textSecondary }} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('discover')}
              className="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.background
              }}
            >
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.warning}20` }}
                >
                  <Search className="h-5 w-5" style={{ color: colors.warning }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.textPrimary }}>
                    Discover Customers
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Find new business opportunities
                  </p>
                </div>
              </div>
              <Search className="h-5 w-5" style={{ color: colors.textSecondary }} />
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border p-6"
          style={{ borderColor: colors.border }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Building className="h-4 w-4" style={{ color: colors.success }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  New business partnership approved
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  2 hours ago
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                <MessageCircle className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  New message from customer
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  4 hours ago
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${colors.warning}20` }}
              >
                <Package className="h-4 w-4" style={{ color: colors.warning }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  New product added to catalog
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  1 day ago
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <ShoppingCart className="h-4 w-4" style={{ color: colors.primary }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  New order received
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  2 days ago
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;


