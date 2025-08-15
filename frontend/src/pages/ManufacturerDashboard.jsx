import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, FileText, Eye, Award, Clock, X, MessageCircle,
  ChevronRight, Factory
} from 'lucide-react';
import api from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { colors } from '../constants/theme';
import Overview from '../components/ManufacturerDashboard/Overview';
import Requests from '../components/ManufacturerDashboard/Requests';
import DiscoverCustomers from '../components/ManufacturerDashboard/DiscoverCustomers';
import ProposalDiscovery from '../components/ManufacturerDashboard/ProposalDiscovery';
import SettingsComponent from '../components/ManufacturerDashboard/Settings';
import ChatManager from '../components/ChatManager/ChatManager';
import Sidebar from '../components/ManufacturerDashboard/Sidebar';

const ManufacturerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestStats, setRequestStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestDetail, setShowRequestDetail] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/management/manufacturer/customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      
      // Add error handling and timeout for better reliability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const [requestsResponse, statsResponse] = await Promise.all([
        api.get('/management/manufacturer/my-requests/', { signal: controller.signal }),
        api.get('/management/manufacturer/request-stats/', { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);
      setRequests(requestsResponse.data);
      setRequestStats(statsResponse.data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout');
      } else {
        console.error('Error fetching requests:', error);
      }
      setRequests([]);
      setRequestStats(null);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const response = await api.get('/management/manufacturer/incoming-requests/');
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      return [];
    }
  };

  const fetchIncomingRequestDetail = async (requestId) => {
    try {
      const response = await api.get(`/management/manufacturer/incoming-requests/${requestId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming request detail:', error);
      throw error;
    }
  };

  const fetchRequestDetail = async (requestId) => {
    try {
      const response = await api.get(`/management/manufacturer/my-requests/${requestId}/`);
      setSelectedRequest(response.data);
      setShowRequestDetail(true);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      showToast('Failed to load request details', 'error');
    }
  };



  const showToast = (message, type = 'success') => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
    } text-white font-medium flex items-center`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const toggleCustomerExpansion = (customerId) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.businesses.some(biz => biz.business_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || customer.relationship_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return `bg-green-50 text-green-700 border-green-200`;
      case 'pending': return `bg-yellow-50 text-yellow-700 border-yellow-200`;
      case 'rejected': return `bg-red-50 text-red-700 border-red-200`;
      default: return `bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Award size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'rejected': return <X size={14} />;
      default: return <Eye size={14} />;
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'approved': return `bg-green-50 text-green-700 border-green-200`;
      case 'pending': return `bg-yellow-50 text-yellow-700 border-yellow-200`;
      case 'rejected': return `bg-red-50 text-red-700 border-red-200`;
      default: return `bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const getRequestStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Award size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'rejected': return <X size={14} />;
      default: return <Eye size={14} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.relationship_status === 'approved').length,
    pendingRequests: requestStats?.pending_requests || 0,
    totalRequests: requestStats?.total_requests || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.background }}>
        <div className="text-center">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: colors.cardHeaderBg }}
            >
              <Factory size={24} className="text-white" />
            </div>
            <div 
              className="absolute inset-0 rounded-full border-4 animate-pulse"
              style={{ borderColor: colors.border }}
            ></div>
          </div>
          <p className="mt-6 font-medium" style={{ color: colors.text }}>
            Loading your manufacturer dashboard...
          </p>
          <p className="mt-2 text-sm" style={{ color: colors.textLight }}>
            Preparing your business overview
          </p>
        </div>
      </div>
    );
  }



  // Get current tab label for header
  const getCurrentTabLabel = () => {
    const tabLabels = {
      'overview': 'Overview',
      'requests': 'My Requests',
      'discover': 'Discover Customers',
      'proposals': 'Proposals',
      'chats': 'Chats',
      'settings': 'Settings'
    };
    return tabLabels[activeTab] || 'Dashboard';
  };

  const getCurrentTabDescription = () => {
    const tabDescriptions = {
      'overview': 'Business overview and performance metrics',
      'requests': 'Manage contact requests from customers',
      'discover': 'Find and connect with potential customers',
      'proposals': 'Respond to customer proposals',
      'chats': 'Communicate with your customers',
      'settings': 'Manage your account and preferences'
    };
    return tabDescriptions[activeTab] || '';
  };

  return (
    <div className="flex h-screen" style={{ background: colors.background }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentUser={currentUser}
        requestStats={requestStats}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header 
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ 
            background: colors.cardBg,
            borderColor: colors.border 
          }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight 
                size={20} 
                className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                style={{ color: colors.text }}
              />
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                {getCurrentTabLabel()}
              </h1>
              <p className="text-sm" style={{ color: colors.textLight }}>
                {getCurrentTabDescription()}
              </p>
            </div>
          </div>


        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Overview
                  customers={filteredCustomers}
                  loading={loading}
                  expandedCustomers={expandedCustomers}
                  toggleCustomerExpansion={toggleCustomerExpansion}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  stats={stats}
                  colors={colors}
                />
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Requests
                  requests={requests}
                  requestStats={requestStats}
                  requestsLoading={requestsLoading}
                  filteredRequests={filteredRequests}
                  selectedRequest={selectedRequest}
                  showRequestDetail={showRequestDetail}
                  fetchRequestDetail={fetchRequestDetail}
                  setShowRequestDetail={setShowRequestDetail}
                  getRequestStatusColor={getRequestStatusColor}
                  getRequestStatusIcon={getRequestStatusIcon}
                  formatDate={formatDate}
                  setActiveTab={setActiveTab}
                  colors={colors}
                  refreshRequests={fetchRequests}
                  fetchIncomingRequests={fetchIncomingRequests}
                  fetchIncomingRequestDetail={fetchIncomingRequestDetail}
                />
              </motion.div>
            )}

            {activeTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DiscoverCustomers
                  currentUser={currentUser}
                  colors={colors}
                />
              </motion.div>
            )}

            {activeTab === 'proposals' && (
              <motion.div
                key="proposals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ProposalDiscovery colors={colors} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsComponent colors={colors} />
              </motion.div>
            )}

            {activeTab === 'chats' && (
              <motion.div
                key="chats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ChatManager />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;