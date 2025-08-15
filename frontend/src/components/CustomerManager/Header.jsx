import React, { useState } from 'react';
import { 
  Search, Plus, Menu,
  Settings, Factory, ShoppingBag, 
  LayoutGrid, Package, CreditCard, BarChart, List, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/theme'; // Centralized color import

const Header = ({
  activeTab,
  productSubTab,
  searchQuery,
  setSearchQuery,
  products,
  orders,
  customers,
  userType = 'manufacturer',
  onLogout,
  setActiveTab,
  navigate,
  onPlaceOrderClick,
  showAddForm,
  setShowAddForm
}) => {
  const [darkMode, setDarkMode] = useState(false);
  
  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'products': return 'Products';
      case 'orders': return userType === 'manufacturer' ? 'Orders' : 'My Orders';
      case 'templates': return 'Templates';
      case 'payments': return 'Payments';
      case 'sales': return 'Sales Management';
      case 'customers': return userType === 'manufacturer' ? 'Customers' : 'Profile';
      case 'analytics': return 'Analytics';
      case 'settings': return 'Settings';
      case 'order': return 'Place Order';
      default: return activeTab ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) : 'Dashboard';
    }
  };

  const getActiveTabSubtitle = () => {
    if (activeTab === 'products') {
      return userType === 'manufacturer' 
        ? 'Manage your product catalog' 
        : 'Browse available products';
    }
    switch (activeTab) {
      case 'dashboard': 
        return userType === 'manufacturer' 
          ? 'Business overview and quick actions' 
          : 'Your personalized business overview';
      case 'orders': 
        return userType === 'manufacturer' 
          ? 'Track and manage customer orders' 
          : 'View your order history';
      case 'templates': return 'Manage your product templates';
      case 'payments': return 'View and manage transactions';
      case 'sales': return 'Manage your end customers, sales invoices, and track revenue';
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
      case 'products': return 'Search products...';
      case 'orders': return userType === 'manufacturer' ? 'Search orders...' : 'Search your orders...';
      case 'customers': return userType === 'manufacturer' ? 'Search customers...' : 'Search...';
      case 'templates': return 'Search templates...';
      case 'payments': return 'Search payments...';
      default: return 'Search...';
    }
  };

  const getNewButtonLabel = () => {
    switch (activeTab) {
      case 'products':
        return userType === 'customer' ? 'Browse Products' : 'Add Product';
      case 'orders': return userType === 'manufacturer' ? 'New Order' : 'Place Order';
      case 'templates': return 'New Template';
      case 'payments': return 'New Payment';
      default: return 'New';
    }
  };

  const shouldShowNewButton = () => {
    if (userType === 'customer') {
      return ['orders', 'templates'].includes(activeTab);
    }
    return ['products', 'orders'].includes(activeTab);
  };

  const handleAddClick = () => {
    if (userType === 'customer') {
      if (activeTab === 'products') {
        // Handle browse products logic
        if (setShowAddForm) setShowAddForm(true);
      }
      if (activeTab === 'orders') {
        if (onPlaceOrderClick && onPlaceOrderClick.current) {
          onPlaceOrderClick.current();
        }
      }
      if (activeTab === 'templates') {
        // Handle new template logic
        if (setShowAddForm) setShowAddForm(true);
      }
    } else {
      if (activeTab === 'products') {
        setShowAddForm(true);
      }
      if (activeTab === 'orders') {
        // Handle new order logic
        navigate('/orders/new');
      }
    }
  };

  const handleLogout = () => {
    setActiveTab('settings'); // Close user menu and navigate to settings
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
      className="px-6 py-4 flex justify-between items-center transition-all duration-300" 
      style={{ backgroundColor: colors.cardBg, borderBottom: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
            {userType === 'manufacturer' ? (
              <Factory size={16} color="#FFFFFF" />
            ) : (
              <ShoppingBag size={16} color="#FFFFFF" />
            )}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{ color: colors.textPrimary }}>{getActiveTabTitle()}</h1>
            <p className="hidden md:block ml-4 text-xs mt-1" style={{ color: colors.textSecondary }}>{getActiveTabSubtitle()}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {['products', 'orders', 'customers', 'payments', 'templates'].includes(activeTab) && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: colors.textMuted }} />
            <input 
              type="text" 
              placeholder={getSearchPlaceholder()} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm rounded-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }}
            />
          </div>
        )}
        

        
        {/* Add Product Button for Products Tab */}
        {activeTab === 'products' && userType === 'customer' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm && setShowAddForm(true)}
            className="px-4 py-2 rounded-full text-white font-medium flex items-center shadow-sm transition-all duration-200 hover:shadow-md text-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus size={14} className="mr-1.5" />
            Add Product
          </motion.button>
        )}
        

        
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