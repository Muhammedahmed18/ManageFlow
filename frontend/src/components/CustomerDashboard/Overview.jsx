import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, FileText, Users, MessageCircle, TrendingUp, 
  Plus, Eye, Clock, CheckCircle, XCircle, Activity, ChevronRight
} from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';

const Overview = ({ stats, loading }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  console.log('Overview component received stats:', stats);

  const statCards = [
    { title: 'Total Businesses', value: stats?.totalBusinesses || 0, icon: Building, color: 'blue', description: 'Your registered businesses' },
    { title: 'Pending Requests', value: stats?.pendingRequests || 0, icon: FileText, color: 'yellow', description: 'Awaiting response' },
    { title: 'Active Manufacturers', value: stats?.activeManufacturers || 0, icon: Users, color: 'green', description: 'Available partners' },
    { title: 'Unread Messages', value: stats?.unreadMessages || 0, icon: MessageCircle, color: 'purple', description: 'New conversations' }
  ];

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      
      // Fetch recent contact requests (received requests)
      let requests = [];
      try {
        const requestsResponse = await api.get('/management/customer/requests/');
        requests = requestsResponse.data.slice(0, 5).map(req => ({
          id: req.id,
          type: 'request',
          title: `Contact request from ${req.manufacturer_name || 'Manufacturer'}`,
          description: req.message || 'New contact request received',
          time: new Date(req.created_at).toLocaleDateString(),
          status: req.status,
          icon: FileText
        }));
      } catch (error) {
        console.warn('Could not fetch contact requests:', error);
      }

      // Fetch recent businesses
      let businesses = [];
      try {
        const businessesResponse = await api.get('/management/businesses/');
        businesses = businessesResponse.data.slice(0, 3).map(business => ({
          id: business.id,
          type: 'business',
          title: `Business: ${business.name}`,
          description: business.description || 'Business profile updated',
          time: new Date(business.updated_at || business.created_at).toLocaleDateString(),
          status: business.is_public ? 'public' : 'private',
          icon: Building
        }));
      } catch (error) {
        console.warn('Could not fetch businesses:', error);
      }

      // Combine and sort by date
      const allActivity = [...requests, ...businesses]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 8);

      setRecentActivity(allActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchQuickActions = async () => {
    try {
      // Get user's businesses to determine available actions
      const businessesResponse = await api.get('/management/businesses/');
      const businesses = businessesResponse.data;
      
      const actions = [
        {
          id: 'add-business',
          title: 'Add New Business',
          description: 'Register a new business profile',
          icon: Plus,
          color: 'blue',
          action: () => window.location.hash = '#businesses'
        }
      ];

      // Add manufacturer discovery action
      actions.push({
        id: 'discover-manufacturers',
        title: 'Discover Manufacturers',
        description: 'Find new manufacturing partners',
        icon: Users,
        color: 'green',
        action: () => window.location.hash = '#manufacturers'
      });

      // Add contact requests action if there are pending requests
      if (stats?.pendingRequests > 0) {
        actions.push({
          id: 'view-requests',
          title: 'View Pending Requests',
          description: `${stats.pendingRequests} requests awaiting response`,
          icon: FileText,
          color: 'yellow',
          action: () => window.location.hash = '#requests'
        });
      }

      setQuickActions(actions);
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      setQuickActions([]);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
    fetchQuickActions();
  }, [stats]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'public':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
      case 'private':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'public':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
      case 'private':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading || activityLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: colors.textPrimary }}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
              <div className={`p-3 rounded-full bg-${card.color}-100`}>
                <card.icon className={`w-6 h-6 text-${card.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={action.action}
                className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <div className={`p-2 rounded-full bg-${action.color}-100 mr-3`}>
                  <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={`${activity.id}-${activity.type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-full bg-gray-100">
                    <activity.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-xs text-gray-400">{activity.time}</span>
                      {getStatusIcon(activity.status)}
                      <span className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;
