import React, { useState } from 'react';
import { 
  Search, Plus, Menu, Bell, User, ChevronDown, 
  Settings, Factory, ShoppingBag, 
  LayoutGrid, Package, CreditCard, BarChart, List, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const Header = ({
  activeTab,
  productSubTab,
  searchQuery,
  setSearchQuery,
  products,
  templates,
  orders,
  customers,
  userType = 'manufacturer',
  colors = { primary: '#3b82f6', secondary: '#dbeafe', textDark: '#1e293b' },
  onLogout,
  setActiveTab,
  navigate
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'products':
        return productSubTab === 'templates' ? 'Product Templates' : 'Products';
      case 'orders': return userType === 'manufacturer' ? 'Orders' : 'My Orders';
      case 'payments': return 'Payments';
      case 'customers': return userType === 'manufacturer' ? 'Customers' : 'Profile';
      case 'analytics': return 'Analytics';
      case 'settings': return 'Settings';
      case 'order': return 'Place Order';
      default: return activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : 'Dashboard';
    }
  };

  const getActiveTabSubtitle = () => {
    if (activeTab === 'products') {
      return productSubTab === 'templates'
        ? 'Manage your template catalog'
        : userType === 'manufacturer' 
          ? 'Manage your product catalog' 
          : 'Browse available products';
    }
  
    switch (activeTab) {
      case 'dashboard': 
        return userType === 'manufacturer' 
          ? 'Business overview and quick actions' 
          : 'Your personalized dashboard';
      case 'orders': 
        return userType === 'manufacturer' 
          ? 'Track and manage customer orders' 
          : 'View your order history';
      case 'payments': return 'View and manage transactions';
      case 'customers': 
        return userType === 'manufacturer' 
          ? 'View and manage your customers' 
          : 'Manage your profile settings';
      case 'analytics': 
        return userType === 'manufacturer' 
          ? 'Track your business performance' 
          : 'View your activity metrics';
      case 'settings': return 'Configure your settings';
      case 'order': return 'Create a new order';
      default: return 'Welcome back!';
    }
  };  

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'products':
        return productSubTab === 'templates' ? 'Search templates...' : 'Search products...';
      case 'orders': return userType === 'manufacturer' ? 'Search orders...' : 'Search your orders...';
      case 'customers': return userType === 'manufacturer' ? 'Search customers...' : 'Search...';
      case 'payments': return 'Search payments...';
      default: return 'Search...';
    }
  };

  const getNewButtonLabel = () => {
    switch (activeTab) {
      case 'products':
        return productSubTab === 'templates' ? 'New Template' : 'Add Product';
      case 'orders': return userType === 'manufacturer' ? 'New Order' : 'Place Order';
      case 'payments': return 'New Payment';
      default: return 'New';
    }
  };

  const getItemCount = () => {
    switch (activeTab) {
      case 'products':
        return productSubTab === 'templates' ? templates?.length || 0 : products?.length || 0;
      case 'orders': return orders?.length || 0;
      case 'customers': return customers?.length || 0;
      default: return 0;
    }
  };

  const getItemLabel = () => {
    switch (activeTab) {
      case 'products':
        return productSubTab === 'templates' ? 'Templates' : 'Products';
      case 'orders': return 'Orders';
      case 'customers': return userType === 'manufacturer' ? 'Customers' : '';
      case 'payments': return 'Payments';
      default: return '';
    }
  };

  const shouldShowNewButton = () => {
    if (userType === 'customer') {
      return ['orders', 'products'].includes(activeTab);
    }
    return ['products', 'orders', 'payments'].includes(activeTab);
  };

  const handleAddClick = () => {
    if (userType === 'customer') {
      if (activeTab !== 'order') {
        setActiveTab('order');
      }
    } else {
      // Manufacturer logic
      if (activeTab === 'products') {
        navigate('/products/new');
      } else if (activeTab === 'orders') {
        navigate('/orders/new');
      }
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
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
      className={`bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <div className="md:hidden">
              <motion.button 
                variants={buttonHoverVariants}
                whileHover="hover"
                whileTap="tap"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              </motion.button>
            </div>

            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${
                darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                {userType === 'manufacturer' ? (
                  <Factory size={20} className="text-blue-600" />
                ) : (
                  <ShoppingBag size={20} className="text-blue-600" />
                )}
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {getActiveTabTitle()}
                </h1>
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } mt-0.5 font-medium`}>
                  {getActiveTabSubtitle()}
                </p>
              </div>
            </div>

            {['products', 'orders', 'customers', 'payments'].includes(activeTab) && getItemCount() > 0 && (
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: darkMode ? colors.primary + '40' : colors.secondary,
                  color: darkMode ? 'white' : colors.primary
                }}
              >
                {getItemCount()} {getItemLabel()}
              </motion.span>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Input */}
            {['products', 'orders', 'customers', 'payments', 'dashboard'].includes(activeTab) && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="relative hidden md:block"
              >
                <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-64 text-sm transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 hover:border-gray-600' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
              </motion.div>
            )}

            {/* Notifications */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg relative ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
              >
                <Bell size={18} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>
            </motion.div>

            {/* User Profile with Dropdown */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-2 p-1.5 rounded-lg ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors duration-200`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <User size={16} className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
                </div>
                <ChevronDown size={14} className={`hidden sm:block ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              </button>
              
              {/* User dropdown menu */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
                  style={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
                  }}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('settings');
                      }}
                      className={`flex items-center w-full px-4 py-2 text-left ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                      style={{ color: darkMode ? '#e5e7eb' : colors.textDark }}
                    >
                      <Settings className="mr-2" size={16} /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full px-4 py-2 text-left ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                      style={{ color: darkMode ? '#e5e7eb' : colors.textDark }}
                    >
                      <LogOut className="mr-2" size={16} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Action Button */}
            {shouldShowNewButton() && (
              <motion.button
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: darkMode 
                    ? "0 4px 6px rgba(59, 130, 246, 0.4)" 
                    : "0 4px 6px rgba(59, 130, 246, 0.25)"
                }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddClick}
                className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                <Plus size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{getNewButtonLabel()}</span>
                <span className="sm:hidden">New</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;