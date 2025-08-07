import React, { useState, useEffect } from 'react';
import { 
    Grid3X3,
    Package,
    Settings,
    ChevronDown,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ClipboardList,
    CreditCard,
    LogOut,
    DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  productSubTab,
  setProductSubTab,
  businessName = "Your Business",
  colors = {
    primary: '#1C2E4A',
    secondary: '#3b82f6',
    accent: '#0F1A2B',
        dark: '#2D3748',
    light: '#BDC4D4',
    cream: '#D1CFC9',
    textDark: '#1A202C',
    textMedium: '#4A5568'
  }
}) => {
    const { role, logout } = useAuth();
    const navigate = useNavigate();
    const [openSubmenus, setOpenSubmenus] = useState({});
    const [hoveredItem, setHoveredItem] = useState(null);

    useEffect(() => {
        setOpenSubmenus({
            products: activeTab === 'products' || activeTab === 'templates'
        });
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', icon: Grid3X3, tab: 'dashboard' },
        { name: 'Products', icon: Package, tab: 'products' },
        { name: 'Orders', icon: ClipboardList, tab: 'orders' },
        { name: 'Payments', icon: CreditCard, tab: 'payments'},
        { name: 'Settings', icon: Settings, tab: 'settings'},
    ];

    const toggleSubmenu = (tab) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [tab]: !prev[tab]
        }));
    };

    const Badge = ({ count, color }) => (
        <span 
            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full text-white ml-auto"
            style={{ backgroundColor: color, minWidth: '20px', height: '20px' }}
        >
            {count}
        </span>
    );

    // Get first letter of business name
    const getBusinessInitial = () => {
        if (businessName) {
            return businessName.charAt(0).toUpperCase();
        }
        return 'B'; // Default to 'B' for Business Manager
    };

    const NavItem = ({ item }) => {
        const isActive = activeTab === item.tab || (item.subItems && item.subItems.some(sub => activeTab === sub.tab));
        const isSubmenuOpen = openSubmenus[item.tab] || false;

        const handleItemClick = () => {
            if (item.subItems) {
                toggleSubmenu(item.tab);
                if (!item.subItems.some(sub => sub.tab === activeTab)) {
                    setActiveTab(item.subItems[0].tab);
                }
            } else {
                setActiveTab(item.tab);
            }
        };
        
        const handleSubItemClick = (e, subTab) => {
            e.stopPropagation();
            setActiveTab(subTab);
        };

        return (
            <div className="relative">
                <div
                    onClick={handleItemClick}
                    onMouseEnter={() => setHoveredItem(item.tab)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex flex-col text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive 
                            ? 'text-white' 
                            : hoveredItem === item.tab 
                                ? 'text-gray-200' 
                                : 'text-gray-300 hover:text-white'
                    }`}
                    style={{
                        backgroundColor: isActive ? colors.dark : 'transparent'
                    }}
                >
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center flex-1">
                            <item.icon size={20} className="mr-3 flex-shrink-0" />
                            {!sidebarCollapsed && (
                                <span className="truncate">{item.name}</span>
                            )}
                            {!sidebarCollapsed && item.badge && (
                                <Badge count={item.badge.count} color={item.badge.color} />
                            )}
                        </div>
                        {!sidebarCollapsed && item.subItems && (
                            <div className="ml-2 flex-shrink-0">
                                {isSubmenuOpen ? (
                                    <ChevronDown size={16} className="transition-transform duration-200" />
                                ) : (
                                    <ChevronRight size={16} className="transition-transform duration-200" />
                                )}
                            </div>
                        )}
                    </div>

                    {!sidebarCollapsed && item.subItems && isSubmenuOpen && (
                        <div className="pb-2 space-y-1">
                            {item.subItems.map(subItem => (
                                <div
                                    key={subItem.name}
                                    onClick={(e) => handleSubItemClick(e, subItem.tab)}
                                    className={`mx-3 rounded-md p-2 pl-11 transition-colors duration-200 flex items-center justify-between cursor-pointer ${
                                        activeTab === subItem.tab
                                            ? 'text-white font-semibold'
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                    style={{
                                        backgroundColor: activeTab === subItem.tab ? colors.dark : 'transparent'
                                    }}
                                >
                                    <span className="truncate">{subItem.name}</span>
                                    {subItem.badge && (
                                        <Badge count={subItem.badge.count} color={subItem.badge.color} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {sidebarCollapsed && hoveredItem === item.tab && (
                    <div className="absolute left-full top-0 ml-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap z-50 shadow-lg bg-gray-800 text-white">
                        <div className="flex items-center">
                            <span>{item.name}</span>
                            {item.badge && (
                                <Badge count={item.badge.count} color={item.badge.color} />
                            )}
                        </div>
                        {item.subItems && (
                            <div className="mt-2 pl-2 border-l border-gray-600 space-y-1">
                                {item.subItems.map(sub => (
                                    <div key={sub.name} className="py-1 flex items-center justify-between">
                                        <span className="text-xs">{sub.name}</span>
                                        {sub.badge && (
                                            <Badge count={sub.badge.count} color={sub.badge.color} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
            className={`flex flex-col justify-between h-full transition-all duration-300 border-r border-gray-200 ${
                sidebarCollapsed ? 'w-20' : 'w-64'
            }`}
            style={{ backgroundColor: colors.primary }}
        >
            <div className="p-4">
                {/* Logo/Brand Section */}
                <div className="flex items-center justify-between mb-8">
                    {!sidebarCollapsed ? (
                        <div className="flex items-center overflow-hidden">
                            <div 
                                className="w-8 h-8 mr-3 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: colors.accent }}
                            >
                                {getBusinessInitial()}
          </div>
                            <div className="overflow-hidden">
                                <h1 className="text-lg font-semibold text-white truncate">
                                    {businessName || 'Business Manager'}
                                </h1>
              <p className="text-xs text-gray-300 truncate">
                                    {role === 'manufacturer' ? 'Manufacturer Portal' : 'Business Portal'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex justify-center">
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: colors.accent }}
                            >
                                {getBusinessInitial()}
                            </div>
            </div>
          )}
                    
                    <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0 text-gray-300"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
                        {sidebarCollapsed ? (
                            <ChevronsRight size={14} />
                        ) : (
                            <ChevronsLeft size={14} />
                        )}
                    </button>
      </div>

      {/* Navigation */}
                <nav className="space-y-1">
                    {navItems.map(item => (
                        <NavItem key={item.name} item={item} />
                    ))}
                </nav>
            </div>

            {/* Logout Section */}
            <div className="p-4 border-t border-gray-700/50">
                <div
                    onClick={handleLogout}
                    onMouseEnter={() => setHoveredItem('logout')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`flex items-center p-3 text-sm font-medium rounded-lg cursor-pointer transition-colors duration-200 ${
                        hoveredItem === 'logout' 
                            ? 'bg-red-600 text-white' 
                            : 'text-gray-300 hover:text-white hover:bg-red-500'
                    }`}
                >
                    <LogOut size={20} className="mr-3 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Logout</span>}
                    
                    {sidebarCollapsed && hoveredItem === 'logout' && (
                        <div className="absolute left-full top-0 ml-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap z-50 shadow-lg bg-red-600 text-white">
                            Logout
                        </div>
                    )}
                </div>
            </div>
    </motion.div>
  );
};

export default Sidebar;