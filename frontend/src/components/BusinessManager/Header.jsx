import React, { useState } from 'react';
import { 
  Plus, Factory
} from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/theme'; // Centralized color import

const Header = ({
  activeTab,
  productSubTab,
  setShowAddForm,
  products,
  templates,
  orders,
  customers,
  userType = 'manufacturer',
  onCreateInvoice
}) => {
  
  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'products':
        return productSubTab === 'templates' ? 'Product Templates' : 'Products';
      case 'orders': return 'Order Management';
      case 'payments': return 'Invoice Management';
      case 'customers': return 'Customers';
      case 'analytics': return 'Analytics';
      case 'predictions': return 'AI Predictions';
      case 'ai-dashboard': return 'AI Business Intelligence';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getActiveTabSubtitle = () => {
    if (activeTab === 'products') {
      return productSubTab === 'templates'
        ? 'Manage your template catalog'
        : 'Manage your product catalog';
    }
  
    switch (activeTab) {
      case 'dashboard': return 'Business overview and quick actions';
      case 'orders': return 'Track and manage customer orders';
      case 'payments': return 'Manage and track all invoices for your business';
      case 'customers': return 'View and manage your customers';
      case 'analytics': return 'Track your business performance';
      case 'predictions': return 'Business Intelligence & Analytics Dashboard';
      case 'ai-dashboard': return 'Advanced analytics powered by machine learning';
      case 'settings': return 'Configure your settings';
      default: return 'Welcome back!';
    }
  };  

  const getNewButtonLabel = () => {
    switch (activeTab) {
      case 'payments': return 'Create Invoice';
      default: return 'New';
    }
  };

  const shouldShowNewButton = () => {
    return ['payments'].includes(activeTab);
  };

  const handleAddClick = () => {
    if (activeTab === 'payments' && onCreateInvoice) {
      console.log('🔄 Header: Create Invoice clicked - calling onCreateInvoice');
      onCreateInvoice();
    }
  };

  // Animation variants
  const buttonHoverVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <motion.header 
      initial="hidden"
      animate="visible"
      variants={headerVariants}
      className="px-6 py-4 flex justify-between items-center transition-all duration-300" 
      style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}
    >
      {/* Left Section */}
      <div className="flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
            <Factory size={16} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{ color: colors.textPrimary }}>{getActiveTabTitle()}</h1>
            <p className="hidden md:block ml-4 text-xs mt-1" style={{ color: colors.textSecondary }}>{getActiveTabSubtitle()}</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Action Button */}
        {shouldShowNewButton() && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddClick}
            className="px-4 py-2 rounded-full text-white font-medium flex items-center shadow-sm transition-all duration-200 hover:shadow-md text-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus size={14} className="mr-1.5" />
            {getNewButtonLabel()}
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};

export default Header;