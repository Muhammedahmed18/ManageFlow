import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, DollarSign, Users, Calendar, Activity, Building, TrendingUp, TrendingDown, Target, RefreshCw, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomerPerformanceOverview from './CustomerPerformanceOverview';
import LoadingSpinner from '../shared/LoadingSpinner';

const Dashboard = ({ businessId = null }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('weekly');

  // API base URL - adjust this if your backend runs on a different port
  const API_BASE_URL = 'http://localhost:8000';

  // Automatic data fetch when component mounts
  useEffect(() => {
    if (businessId && isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [businessId, isAuthenticated]);

  // Color scheme constants
  const colors = {
    midnightBlue: '#1C2E4A',
    dustyBlue: '#52677D',
    ivory: '#BDC4D4',
    deepNavy: '#0F1A2B',
    buttercream: '#D1CFC9',
    primary: '#1C2E4A',
    secondary: '#52677D',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1C2E4A',
    textSecondary: '#52677D',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  };



  // Manual data fetching functions - only called when user clicks
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from sessionStorage (as used in AuthContext)
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch businesses - customers can see their own business
      try {
        const businessesResponse = await fetch(`${API_BASE_URL}/api/management/businesses/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!businessesResponse.ok) {
          console.warn('Businesses API failed:', businessesResponse.status);
          setBusinesses([]);
        } else {
          const businessesData = await businessesResponse.json();
          setBusinesses(businessesData);
        }
      } catch (error) {
        console.warn('Error fetching businesses:', error);
        setBusinesses([]);
      }

      // Fetch customer orders
      try {
        const ordersResponse = await fetch(`${API_BASE_URL}/api/management/customer/orders/?business=${businessId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!ordersResponse.ok) {
          console.warn('Orders API failed:', ordersResponse.status);
          setOrders([]);
        } else {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        }
      } catch (error) {
        console.warn('Error fetching orders:', error);
        setOrders([]);
      }

      // Fetch customer invoices
      try {
        const invoicesResponse = await fetch(`${API_BASE_URL}/api/management/invoices/?business=${businessId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!invoicesResponse.ok) {
          console.warn('Invoices API failed:', invoicesResponse.status);
          setInvoices([]);
        } else {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);
        }
      } catch (error) {
        console.warn('Error fetching invoices:', error);
        setInvoices([]);
      }

      // Fetch products for the specific business
      try {
        const productsResponse = await fetch(`${API_BASE_URL}/api/management/products/?business=${businessId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!productsResponse.ok) {
          console.warn('Products API failed:', productsResponse.status);
          setProducts([]);
        } else {
          const productsData = await productsResponse.json();
          const productsArray = Array.isArray(productsData) ? productsData : [];
          setProducts(productsArray);
        }
      } catch (error) {
        console.warn('Error fetching products:', error);
        setProducts([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total revenue from paid invoices (customer invoices)
  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid' && invoice.invoice_type === 'customer')
    .reduce((sum, invoice) => sum + (parseFloat(invoice.total_amount) || 0), 0);

  // Calculate revenue from completed orders (customer orders)
  const orderRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => {
      const orderValue = order.data?.total_amount || order.data?.amount || 0;
      return sum + (parseFloat(orderValue) || 0);
    }, 0);

  // For customers, show their order revenue as the primary metric
  const finalRevenue = orderRevenue || totalRevenue;

  // Calculate revenue growth based on recent vs older orders
  const calculateRevenueGrowth = () => {
    if (orders.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
    
    // Recent revenue (last 30 days) from completed orders
    const recentRevenue = orders
      .filter(order => order.status === 'completed' && new Date(order.created_at) >= thirtyDaysAgo)
      .reduce((sum, order) => {
        const orderValue = order.data?.total_amount || order.data?.amount || 0;
        return sum + (parseFloat(orderValue) || 0);
      }, 0);
    
    // Previous period revenue (30-60 days ago) from completed orders
    const previousRevenue = orders
      .filter(order => order.status === 'completed' && 
        new Date(order.created_at) >= sixtyDaysAgo && 
        new Date(order.created_at) < thirtyDaysAgo)
      .reduce((sum, order) => {
        const orderValue = order.data?.total_amount || order.data?.amount || 0;
        return sum + (parseFloat(orderValue) || 0);
      }, 0);
    
    if (previousRevenue === 0) return recentRevenue > 0 ? 100 : 0;
    
    return ((recentRevenue - previousRevenue) / previousRevenue) * 100;
  };
  
  const revenueGrowth = calculateRevenueGrowth();

  // Ensure products is always an array
  const productsArray = Array.isArray(products) ? products : [];



  // No business ID provided
  if (!businessId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg font-medium" style={{ color: colors.textPrimary }}>No business selected</p>
            <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Please select a business to view dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  // No user state - show basic dashboard
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 border" style={{ borderColor: colors.border }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.ivory }}>
                <Users size={32} style={{ color: colors.primary }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Welcome Back</h2>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>Please log in to view your personalized dashboard</p>
              <button 
                onClick={() => window.location.href = '/login'} 
                className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#FFFFFF'
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 border" style={{ borderColor: colors.border }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
                <svg className="w-8 h-8" style={{ color: colors.error }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>Something went wrong</h2>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#FFFFFF'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 sm:px-4 lg:px-6 py-4" style={{ backgroundColor: colors.background }}>
      
      {/* Error indicator */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4" style={{ color: colors.error }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs" style={{ color: colors.error }}>{error}</p>
            </div>
            <div className="ml-auto pl-2">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Stats Row - More Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.ivory }}>
              <Package size={20} style={{ color: colors.primary }} />
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: colors.ivory, color: colors.primary }}>
              Products
            </span>
          </div>
          <h2 className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Total Products</h2>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{productsArray.length}</p>
            <span className="ml-1 text-xs" style={{ color: colors.textMuted }}>items</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
              <ShoppingBag size={20} style={{ color: colors.success }} />
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#ECFDF5', color: colors.success }}>
              Orders
            </span>
          </div>
          <h2 className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Total Orders</h2>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{orders.length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <DollarSign size={20} style={{ color: colors.warning }} />
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: '#FEF3C7', color: colors.warning }}>
              Revenue
            </span>
          </div>
          <h2 className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Total Revenue</h2>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>${finalRevenue.toFixed(2)}</p>
          </div>
          <div className="flex items-center mt-2">
            {revenueGrowth > 0 ? (
              <TrendingUp size={14} style={{ color: colors.success }} />
            ) : revenueGrowth < 0 ? (
              <TrendingDown size={14} style={{ color: colors.error }} />
            ) : (
              <Target size={14} style={{ color: colors.warning }} />
            )}
            <span className={`ml-1 text-xs font-medium ${
              revenueGrowth > 0 ? 'text-green-600' : 
              revenueGrowth < 0 ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%
            </span>
            <span className="ml-1 text-xs" style={{ color: colors.textMuted }}>vs last month</span>
          </div>
        </div>
      </div>

      {/* Performance Overview Section - Much Smaller Height */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main Performance Chart - Smaller Height */}
        <div className="bg-white rounded-xl shadow-sm p-4 xl:col-span-2 transition-all duration-300 hover:shadow-lg border" style={{ borderColor: colors.border }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>Performance Overview</h2>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Monthly metrics visualization</p>
            </div>
            <div className="flex space-x-1 mt-3 sm:mt-0">
              <button 
                onClick={() => setSelectedTimePeriod('weekly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTimePeriod === 'weekly' 
                    ? 'text-white' 
                    : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: selectedTimePeriod === 'weekly' ? colors.primary : 'transparent',
                  color: selectedTimePeriod === 'weekly' ? '#FFFFFF' : colors.textSecondary
                }}
              >
                Weekly
              </button>
              <button 
                onClick={() => setSelectedTimePeriod('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTimePeriod === 'monthly' 
                    ? 'text-white' 
                    : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: selectedTimePeriod === 'monthly' ? colors.primary : 'transparent',
                  color: selectedTimePeriod === 'monthly' ? '#FFFFFF' : colors.textSecondary
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setSelectedTimePeriod('yearly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTimePeriod === 'yearly' 
                    ? 'text-white' 
                    : 'hover:bg-gray-100'
                }`}
                style={{ 
                  backgroundColor: selectedTimePeriod === 'yearly' ? colors.primary : 'transparent',
                  color: selectedTimePeriod === 'yearly' ? '#FFFFFF' : colors.textSecondary
                }}
              >
                Yearly
              </button>
            </div>
          </div>
          <div className="h-40">
            <CustomerPerformanceOverview 
          businessId={businessId} 
          selectedTimePeriod={selectedTimePeriod}
          orders={orders}
          invoices={invoices}
          products={products}
        />
          </div>
        </div>
        
        {/* Recent Orders - Smaller Height */}
        <div className="bg-white rounded-xl shadow-sm p-4 transition-all duration-300 hover:shadow-lg border" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Recent Orders</h2>
            <button className="text-xs font-medium transition-colors hover:underline" style={{ color: colors.primary }}>
              View All
            </button>
          </div>
          
          <div className="space-y-2 h-40 overflow-y-auto">
            {orders.length > 0 ? (
              orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-sm" style={{ backgroundColor: colors.background }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>{order.order_number || `Order #${order.id}`}</p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-600' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.ivory }}>
                  <ShoppingBag size={16} style={{ color: colors.textMuted }} />
                </div>
                <h3 className="text-xs font-medium mb-1" style={{ color: colors.textPrimary }}>No orders yet</h3>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Your orders will appear here</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t" style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>Next delivery</p>
                <div className="flex items-center mt-1">
                  <Calendar size={12} className="mr-1" style={{ color: colors.textSecondary }} />
                  <p className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                    {orders.length > 0 ? 'Check orders for details' : 'No upcoming deliveries'}
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-lg transition-colors hover:bg-gray-50 border" style={{ color: colors.textSecondary, borderColor: colors.border }}>
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;