import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Building, Package, ShoppingCart, Award, 
  ChevronDown, ExternalLink
} from 'lucide-react';
import { colors } from '../../constants/theme';

const Overview = ({ 
  customers, 
  loading, 
  expandedCustomers, 
  toggleCustomerExpansion,
  getStatusColor,
  getStatusIcon,
  stats 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div 
              className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto" 
              style={{ borderColor: colors.accent, borderTopColor: 'transparent' }}
            />
            <div 
              className="absolute inset-0 rounded-full border-4 animate-pulse"
              style={{ borderColor: colors.border }}
            ></div>
          </div>
          <p className="mt-6 font-medium" style={{ color: colors.textPrimary }}>
            Loading your customer network...
          </p>
          <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
            Preparing your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl shadow-sm border p-4"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Total Customers
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {stats.totalCustomers}
              </p>
            </div>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${colors.accent}20` }}
            >
              <Users className="h-5 w-5" style={{ color: colors.accent }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl shadow-sm border p-4"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Active Businesses
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {stats.totalBusinesses}
              </p>
            </div>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${colors.success}20` }}
            >
              <Building className="h-5 w-5" style={{ color: colors.success }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl shadow-sm border p-4"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Total Products
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {stats.totalProducts}
              </p>
            </div>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${colors.warning}20` }}
            >
              <Package className="h-5 w-5" style={{ color: colors.warning }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl shadow-sm border p-4"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Total Orders
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {stats.totalOrders}
              </p>
            </div>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <ShoppingCart className="h-5 w-5" style={{ color: colors.primary }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl shadow-sm border p-4"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                Approved
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {stats.approvedCustomers}
              </p>
            </div>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${colors.success}20` }}
            >
              <Award className="h-5 w-5" style={{ color: colors.success }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {customers.map((customer) => (
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
                  onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
                          className={`border rounded-lg p-4 transition-all duration-300 group hover:shadow-md ${
                            business.relationship_status === 'approved' ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.cardBg
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                          onMouseLeave={(e) => e.target.style.backgroundColor = colors.cardBg}
                          onClick={() => {
                            if (business.relationship_status === 'approved') {
                              window.location.href = `/manage/${business.business_id}`;
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h4 
                                className="font-semibold text-lg transition-colors line-clamp-1"
                                style={{ color: colors.textPrimary }}
                              >
                                {business.business_name}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(business.relationship_status)}`}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(business.relationship_status)}
                                  <span>{business.relationship_status}</span>
                                </div>
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            {business.industry && (
                              <div className="flex items-center text-sm" style={{ color: colors.textSecondary }}>
                                <Building size={14} className="mr-2 flex-shrink-0" />
                                <span className="line-clamp-1">{business.industry}</span>
                              </div>
                            )}
                            <div className="flex items-center text-sm" style={{ color: colors.textSecondary }}>
                              <Package size={14} className="mr-2 flex-shrink-0" />
                              <span>{business.total_products} products</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: colors.border }}>
                            {business.relationship_status === 'approved' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/manage/${business.business_id}`;
                                }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                style={{ 
                                  backgroundColor: colors.accent,
                                  color: 'white'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = colors.accentLight}
                                onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                              >
                                Manage Business
                              </button>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs" style={{ color: colors.textSecondary }}>
                                  Contact customer for approval
                                </span>
                                <div 
                                  className="w-2 h-2 rounded-full animate-pulse"
                                  style={{ backgroundColor: colors.textSecondary }}
                                />
                              </div>
                            )}
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

        {customers.length === 0 && (
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
              Start by discovering new customers to build your business network
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Overview;


