import React from 'react';
import { 
  Home, Building, Users, FileText, MessageCircle, Settings, User,
  ChevronRight, LogOut, Plus, Eye, Edit, Trash2
} from 'lucide-react';
import { colors } from '../../constants/theme';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  currentUser,
  stats,
  onLogout
}) => {
  const navItems = [
    { 
      id: 'overview', 
      label: 'Dashboard', 
      icon: Home, 
      badge: null 
    },
    { 
      id: 'businesses', 
      label: 'My Businesses', 
      icon: Building, 
      badge: stats?.totalBusinesses || 0 
    },
    { 
      id: 'requests', 
      label: 'Contact Requests', 
      icon: FileText, 
      badge: stats?.pendingRequests || 0 
    },
    { 
      id: 'manufacturers', 
      label: 'Manufacturers', 
      icon: Users, 
      badge: stats?.activeManufacturers || 0 
    },
    { 
      id: 'chats', 
      label: 'Chats', 
      icon: MessageCircle, 
      badge: stats?.unreadMessages || 0 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      badge: null 
    },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  return (
    <div 
      className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out flex flex-col`}
      style={{ background: colors.primary }}
    >
      {/* Logo/Brand */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Building size={20} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">Customer</h1>
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
              onClick={() => handleTabClick(item.id)}
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
                </>
              )}
            </button>
          );
        })}
      </nav>



      {/* User Section */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <User size={20} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.first_name && currentUser?.last_name 
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : currentUser?.username || 
                    currentUser?.first_name || 
                    'User'}
              </p>
              <p 
                className="text-xs text-white opacity-70 truncate"
                title={currentUser?.email || 'user@example.com'}
              >
                {currentUser?.email || 'user@example.com'}
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={onLogout}
              className="p-1 rounded hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              title="Logout"
            >
              <LogOut size={16} className="text-white opacity-70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
