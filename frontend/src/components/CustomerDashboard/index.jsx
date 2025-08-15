import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/theme';
import api from '../../services/authService';
import Sidebar from './Sidebar';
import Overview from './Overview';
import BusinessManager from './BusinessManager';
import ContactRequests from './ContactRequests';
import ManufacturerDiscovery from './ManufacturerDiscovery';
import Settings from './Settings';
import ChatManager from '../ChatManager/ChatManager';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalBusinesses: 0,
    totalOrders: 0,
    totalInvoices: 0,
    totalProducts: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If profile fetch fails, try to get user from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Fetch dashboard statistics from existing endpoints
  const fetchDashboardStats = async () => {
    try {
      // First, get the user's business to provide context for API calls
      const businessesResponse = await api.get('/management/businesses/');
      const userBusinesses = businessesResponse.data;
      const totalBusinesses = userBusinesses.length;
      
      // Get the first business for API calls (customers typically have one business)
      const primaryBusiness = userBusinesses.length > 0 ? userBusinesses[0] : null;
      const businessId = primaryBusiness ? primaryBusiness.id : null;

      // Fetch orders count with business context
      const ordersResponse = await api.get(`/management/customer/orders/${businessId ? `?business=${businessId}` : ''}`);
      const totalOrders = ordersResponse.data.length;

      // Fetch invoices count with business context
      const invoicesResponse = await api.get(`/management/invoices/${businessId ? `?business=${businessId}` : ''}`);
      const totalInvoices = invoicesResponse.data.length;

      // Fetch products count with business context
      const productsResponse = await api.get(`/management/products/${businessId ? `?business=${businessId}` : ''}`);
      const totalProducts = productsResponse.data.length;

      // Fetch pending requests count
      const requestsResponse = await api.get('/management/customer/requests/');
      const pendingRequests = requestsResponse.data.filter(req => req.status === 'pending').length;

      // Calculate active manufacturers (manufacturers who have sent requests)
      const activeManufacturers = new Set(requestsResponse.data.map(req => req.manufacturer)).size;

      // Fetch unread messages count from chat rooms
      const chatRoomsResponse = await api.get('/management/chat-rooms/');
      const unreadMessages = chatRoomsResponse.data.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);

      setDashboardStats({
        totalBusinesses,
        totalOrders,
        totalInvoices,
        totalProducts,
        pendingRequests,
        activeManufacturers,
        unreadMessages
      });
      
      console.log('Dashboard stats set:', {
        totalBusinesses,
        totalOrders,
        totalInvoices,
        totalProducts,
        pendingRequests,
        activeManufacturers,
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values on error
      setDashboardStats({
        totalBusinesses: 0,
        totalOrders: 0,
        totalInvoices: 0,
        totalProducts: 0,
        pendingRequests: 0,
        activeManufacturers: 0,
        unreadMessages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardStats();
  }, []);

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['overview', 'businesses', 'requests', 'manufacturers', 'chats', 'settings'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Set initial tab from hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview colors={colors} stats={dashboardStats} />;
      case 'businesses':
        return <BusinessManager />;
      case 'requests':
        return <ContactRequests />;
      case 'manufacturers':
        return <ManufacturerDiscovery />;
      case 'chats':
        return <ChatManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview colors={colors} stats={dashboardStats} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentUser={currentUser}
        stats={dashboardStats}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
