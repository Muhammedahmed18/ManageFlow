import React, { useState } from 'react';
import { 
  Factory, Users, TrendingUp, Activity, Home, ChevronRight, User,
  FileText, MessageCircle, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/theme';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  currentUser,
  requestStats 
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home, badge: null },
    { id: 'businesses', label: 'My Businesses', icon: Factory, badge: null },
    { id: 'requests', label: 'My Requests', icon: FileText, badge: requestStats?.pending_requests || 0 },
    { id: 'discover', label: 'Discover Customers', icon: Users, badge: null },
    { id: 'proposals', label: 'Proposals', icon: TrendingUp, badge: null },
    { id: 'chats', label: 'Chats', icon: MessageCircle, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <div 
      className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out flex flex-col`}
      style={{ background: colors.primary }}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Factory size={20} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">Manufacturer</h1>
              <p className="text-xs text-white opacity-70">Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-white text-gray-800'
                  : 'text-white text-opacity-70 hover:bg-white hover:bg-opacity-10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section with Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <User size={16} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.first_name && currentUser?.last_name 
                    ? `${currentUser.first_name} ${currentUser.last_name}` 
                    : currentUser?.first_name || currentUser?.username || 'User'}
                </p>
                <p className="text-xs text-white opacity-70 truncate">
                  {currentUser?.email || 'user@example.com'}
                </p>
              </div>
            )}
          </div>
          
          {/* Logout Icon */}
          <div
            onClick={handleLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            className="p-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-red-500 flex-shrink-0 ml-2"
          >
            <LogOut size={16} className="text-white" />
            
            {sidebarCollapsed && hoveredItem === 'logout' && (
              <div className="absolute left-full top-0 ml-2 px-3 py-2 text-sm rounded-lg whitespace-nowrap z-50 shadow-lg bg-red-600 text-white">
                Logout
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
