import React from "react";
import { 
  LayoutDashboard, Package, ShoppingCart, CreditCard, Users, 
  BarChart2, Settings, ChevronLeft, ChevronRight, DollarSign, 
  User, Factory, ShoppingBag, Home, ClipboardList, Box, 
  Tag, UserCog, Bell, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  productSubTab,
  setProductSubTab,
  userType = 'manufacturer', // 'manufacturer' or 'customer'
  businessName = "Your Business",
  colors = {
    primary: '#1C2E4A',
    secondary: '#3b82f6',
    accent: '#0F1A2B',
    light: '#BDC4D4',
    cream: '#D1CFC9',
    textDark: '#1A202C',
    textMedium: '#4A5568'
  }
}) => {
  const manufacturerMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "products", label: "Products", icon: <Package size={20} /> },
    { id: "orders", label: "Orders", icon: <ShoppingCart size={20} /> },
    { id: "payments", label: "Payments", icon: <CreditCard size={20} />, secondaryIcon: <DollarSign size={16} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> }
  ];

  const customerMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { id: "products", label: "Products", icon: <ShoppingBag size={20} /> },
    { id: "orders", label: "My Orders", icon: <ClipboardList size={20} /> },
    { id: "payments", label: "Payments", icon: <CreditCard size={20} /> },
    { id: "profile", label: "Profile", icon: <UserCog size={20} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "help", label: "Help Center", icon: <HelpCircle size={20} /> }
  ];

  const menuItems = userType === 'manufacturer' ? manufacturerMenuItems : customerMenuItems;

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col h-full transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } bg-opacity-95 shadow-xl`}
      style={{ 
        background: `linear-gradient(to bottom, ${colors.primary}, ${colors.accent})`,
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px'
      }}
    >
      {/* Logo and Business Name Section */}
      <div className={`p-4 flex ${sidebarCollapsed ? 'justify-center' : 'justify-start'} items-center border-b`} 
        style={{ borderColor: `${colors.light}20` }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center"
        >
          <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${
            sidebarCollapsed ? 'mx-auto' : ''
          }`}
            style={{ 
              background: colors.cream, 
              color: colors.primary 
            }}>
            {userType === 'manufacturer' ? (
              <Factory size={24} />
            ) : (
              <ShoppingBag size={24} />
            )}
          </div>
          
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <h2 className="text-lg font-semibold truncate text-white">{businessName}</h2>
              <p className="text-xs text-gray-300 truncate">
                {userType === 'manufacturer' ? 'Manufacturer Portal' : 'Customer Portal'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Collapse toggle button */}
      <div className="px-4 py-3 flex justify-end">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-full transition-all duration-300"
          style={{
            background: colors.light,
            color: colors.primary,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.li 
              key={item.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
            >
              <motion.button
                whileHover={{ scale: sidebarCollapsed ? 1.1 : 1.02, x: sidebarCollapsed ? 0 : 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? "bg-white/20 text-white shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                style={{
                  borderLeft: activeTab === item.id ? `3px solid ${colors.secondary}` : 'none'
                }}
              >
                <span className={`transition-all duration-200 ${
                  activeTab === item.id ? 'scale-110' : 'scale-100'
                }`}>
                  {React.cloneElement(item.icon, { 
                    color: activeTab === item.id ? 'white' : colors.light,
                    strokeWidth: activeTab === item.id ? 2.5 : 2
                  })}
                </span>
                
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm font-medium tracking-wide truncate">
                    {item.label}
                  </span>
                )}
                
                {/* Secondary icon */}
                {!sidebarCollapsed && item.secondaryIcon && (
                  <span className="ml-auto opacity-70 transition-opacity duration-300">
                    {React.cloneElement(item.secondaryIcon, { color: colors.light })}
                  </span>
                )}
              </motion.button>

              {/* Products submenu (manufacturer only) - now always visible when active */}
              {!sidebarCollapsed && activeTab === 'products' && item.id === 'products' && userType === 'manufacturer' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 ml-8 pl-3 border-l-2 border-white/10"
                >
                  {["products", "templates"].map((subTab) => (
                    <motion.button
                      key={subTab}
                      whileHover={{ x: 3 }}
                      onClick={() => setProductSubTab(subTab)}
                      className={`flex items-center w-full py-2 px-3 mt-1 text-sm rounded-lg transition-all duration-200 ${
                        productSubTab === subTab
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${
                        productSubTab === subTab ? "bg-white scale-125" : "bg-white/60 scale-100"
                      }`}></div>
                      {subTab === 'products' ? 'Products' : 'Templates'}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
};

export default Sidebar;