import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, FileText, Users, MessageCircle, TrendingUp, 
  Plus, Eye, Clock, CheckCircle, XCircle, Activity, ChevronRight,
  Star, BarChart3, Award, Search
} from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';

const Overview = ({ stats, loading }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  console.log('Overview component received stats:', stats);

  const statCards = [
    { 
      title: 'Total Businesses', 
      value: stats?.totalBusinesses || 0, 
      icon: Building, 
      color: colors.accent,
      description: 'Your registered businesses',
      trend: '+5% from last month',
      trendColor: colors.success
    },
    { 
      title: 'Pending Requests', 
      value: stats?.pendingRequests || 0, 
      icon: FileText, 
      color: colors.warning,
      description: 'Awaiting response',
      trend: '2 new today',
      trendColor: colors.warning
    },
    { 
      title: 'Active Manufacturers', 
      value: stats?.activeManufacturers || 0, 
      icon: Users, 
      color: colors.success,
      description: 'Available partners',
      trend: '+12% from last month',
      trendColor: colors.success
    },
    { 
      title: 'Unread Messages', 
      value: stats?.unreadMessages || 0, 
      icon: MessageCircle, 
      color: colors.primary,
      description: 'New conversations',
      trend: '3 new messages',
      trendColor: colors.accent
    }
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
          color: colors.accent,
          action: () => window.location.hash = '#businesses'
        }
      ];

      // Add manufacturer discovery action
      actions.push({
        id: 'discover-manufacturers',
        title: 'Discover Manufacturers',
        description: 'Find new manufacturing partners',
        icon: Users,
        color: colors.success,
        action: () => window.location.hash = '#manufacturers'
      });

      // Add contact requests action if there are pending requests
      if (stats?.pendingRequests > 0) {
        actions.push({
          id: 'view-requests',
          title: 'View Pending Requests',
          description: `${stats.pendingRequests} requests awaiting response`,
          icon: FileText,
          color: colors.warning,
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
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="group relative bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <card.icon className="h-6 w-6" style={{ color: card.color }} />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
                {card.title}
              </p>
              <p className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                {card.value}
              </p>
              <div className="flex items-center text-sm" style={{ color: card.trendColor }}>
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{card.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border p-6"
          style={{ borderColor: colors.border }}
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
                transition={{ delay: 0.6 + index * 0.1 }}
                onClick={action.action}
                className="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.background
                }}
              >
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <action.icon className="h-5 w-5" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: colors.textPrimary }}>
                      {action.title}
                    </p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {action.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5" style={{ color: colors.textSecondary }} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border p-6"
          style={{ borderColor: colors.border }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={`${activity.id}-${activity.type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colors.background}` }}
                  >
                    <activity.icon className="h-4 w-4" style={{ color: colors.textSecondary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {activity.title}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {activity.time}
                    </p>
                  </div>
                  {getStatusIcon(activity.status)}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                <p className="text-sm" style={{ color: colors.textSecondary }}>No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;
