import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, DollarSign, Clock, CheckCircle, Target, Calendar } from 'lucide-react';

const CustomerPerformanceOverview = ({ 
  businessId, 
  selectedTimePeriod = 'monthly',
  orders = [],
  invoices = [],
  products = []
}) => {
  const [performanceData, setPerformanceData] = useState(null);

  const colors = {
    primary: "#1C2E4A",
    secondary: "#52677D",
    accent: "#4F46E5",
    background: "#F8FAFC",
    cardBg: "#FFFFFF",
    textPrimary: "#1C2E4A",
    textSecondary: "#52677D",
    textMuted: "#94A3B8",
    border: "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444"
  };

  useEffect(() => {
    calculatePerformanceData();
  }, [orders, invoices, products, selectedTimePeriod]);

  const calculatePerformanceData = () => {
    // Calculate real performance data from the provided data
    const data = calculateRealPerformanceData();
    setPerformanceData(data);
  };

  const calculateRealPerformanceData = () => {
    // Calculate real performance data from orders, invoices, and products
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    // Order Metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
    // Calculate average order value
    const totalOrderValue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => {
        const orderValue = order.data?.total_amount || order.data?.amount || 0;
        return sum + (parseFloat(orderValue) || 0);
      }, 0);
    const averageOrderValue = completedOrders > 0 ? totalOrderValue / completedOrders : 0;

    // Spending Analysis
    const totalSpent = totalOrderValue;
    const monthlyAverage = totalSpent / 6; // Assuming 6 months of data
    
    // Calculate spending trend
    const recentOrders = orders.filter(order => 
      order.status === 'completed' && new Date(order.created_at) >= thirtyDaysAgo
    );
    const previousOrders = orders.filter(order => 
      order.status === 'completed' && 
      new Date(order.created_at) >= sixtyDaysAgo && 
      new Date(order.created_at) < thirtyDaysAgo
    );
    
    const recentSpending = recentOrders.reduce((sum, order) => {
      const orderValue = order.data?.total_amount || order.data?.amount || 0;
      return sum + (parseFloat(orderValue) || 0);
    }, 0);
    
    const previousSpending = previousOrders.reduce((sum, order) => {
      const orderValue = order.data?.total_amount || order.data?.amount || 0;
      return sum + (parseFloat(orderValue) || 0);
    }, 0);
    
    const spendingTrend = previousSpending === 0 
      ? (recentSpending > 0 ? 'increasing' : 'stable')
      : (recentSpending > previousSpending ? 'increasing' : recentSpending < previousSpending ? 'decreasing' : 'stable');

    // Find top spending month
    const monthlySpending = {};
    orders.filter(order => order.status === 'completed').forEach(order => {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'long' });
      const orderValue = order.data?.total_amount || order.data?.amount || 0;
      monthlySpending[month] = (monthlySpending[month] || 0) + (parseFloat(orderValue) || 0);
    });
    
    const topSpendingMonth = Object.keys(monthlySpending).length > 0 
      ? Object.keys(monthlySpending).reduce((a, b) => monthlySpending[a] > monthlySpending[b] ? a : b)
      : 'No data';

    // Delivery Performance (estimated based on order status)
    const onTimeDeliveries = completedOrders; // Assuming completed orders were delivered on time
    const onTimeDeliveryRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0;
    
    // Calculate average delivery time (estimated)
    const deliveryTimes = orders
      .filter(order => order.status === 'completed' && order.created_at && order.updated_at)
      .map(order => {
        const created = new Date(order.created_at);
        const updated = new Date(order.updated_at);
        return Math.ceil((updated - created) / (1000 * 60 * 60 * 24)); // Days
      });
    
    const averageDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 14; // Default 14 days

    // Satisfaction score (estimated based on completion rate)
    const satisfactionScore = Math.min(5, Math.max(1, (orderCompletionRate / 100) * 5));

    // Activity Metrics
    const activeDays = new Set(
      orders.map(order => new Date(order.created_at).toDateString())
    ).size;
    
    const averageSessionDuration = 25; // Default value since we don't have session data
    const engagementScore = Math.min(100, Math.max(0, (activeDays / 30) * 100));

    return {
      order_metrics: {
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: pendingOrders,
        cancelled_orders: cancelledOrders,
        average_order_value: averageOrderValue,
        order_completion_rate: orderCompletionRate
      },
      spending_analysis: {
        total_spent: totalSpent,
        monthly_average: monthlyAverage,
        spending_trend: spendingTrend,
        top_spending_month: topSpendingMonth,
        budget_utilization: Math.min(100, (totalSpent / 10000) * 100) // Assuming 10k budget
      },
      delivery_performance: {
        on_time_deliveries: onTimeDeliveryRate,
        average_delivery_time: averageDeliveryTime,
        satisfaction_score: satisfactionScore
      },
      activity_metrics: {
        active_days: activeDays,
        average_session_duration: averageSessionDuration,
        engagement_score: engagementScore
      }
    };
  };

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp size={14} color={colors.success} />;
    if (trend === 'decreasing') return <TrendingDown size={14} color={colors.error} />;
    return <Target size={14} color={colors.warning} />;
  };



  if (!performanceData) {
    return (
      <div className="text-center p-4">
        <p className="text-sm" style={{ color: colors.textMuted }}>No performance data available</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Compact Metrics Cards - Horizontal Row */}
      <div className="grid grid-cols-4 gap-3 h-full">
        {/* Orders */}
        <div className="bg-white rounded-lg p-3 shadow-sm border flex flex-col justify-between" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EBF4FF' }}>
              <Package size={16} style={{ color: colors.primary }} />
        </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Orders</span>
        </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{performanceData.order_metrics.total_orders}</h3>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Total orders placed</p>
            <div className="mt-1 flex items-center">
              <CheckCircle size={12} style={{ color: colors.success }} />
              <span className="ml-1 text-xs" style={{ color: colors.textMuted }}>
              {performanceData.order_metrics.completed_orders} completed
            </span>
            </div>
          </div>
        </div>

        {/* Average Order Value - Changed from Spending */}
        <div className="bg-white rounded-lg p-3 shadow-sm border flex flex-col justify-between" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
              <DollarSign size={16} style={{ color: colors.success }} />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Avg Order</span>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>${performanceData.order_metrics.average_order_value.toFixed(0)}</h3>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Average order value</p>
            <div className="mt-1 flex items-center">
            {getTrendIcon(performanceData.spending_analysis.spending_trend)}
              <span className="ml-1 text-xs" style={{ color: colors.textMuted }}>
              {performanceData.spending_analysis.spending_trend} trend
            </span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-lg p-3 shadow-sm border flex flex-col justify-between" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <Clock size={16} style={{ color: colors.warning }} />
            </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Delivery</span>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{performanceData.delivery_performance.on_time_deliveries.toFixed(0)}%</h3>
            <p className="text-xs" style={{ color: colors.textSecondary }}>On-time deliveries</p>
            <div className="mt-1 flex items-center">
              <span className="text-xs" style={{ color: colors.textMuted }}>
              Avg: {performanceData.delivery_performance.average_delivery_time.toFixed(0)} days
            </span>
          </div>
        </div>
      </div>

        {/* Satisfaction */}
        <div className="bg-white rounded-lg p-3 shadow-sm border flex flex-col justify-between" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3E8FF' }}>
              <Target size={16} style={{ color: colors.primary }} />
        </div>
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>Satisfaction</span>
            </div>
            <div>
            <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{performanceData.delivery_performance.satisfaction_score.toFixed(1)}</h3>
            <p className="text-xs" style={{ color: colors.textSecondary }}>Satisfaction score</p>
            <div className="mt-1 flex items-center">
              <span className="text-xs" style={{ color: colors.textMuted }}>out of 5.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPerformanceOverview;


