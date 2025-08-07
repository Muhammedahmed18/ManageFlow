import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Check, 
  Package, 
  User, 
  Calendar, 
  DollarSign,
  AlertCircle,
  Info
} from 'lucide-react';
import api from '../../services/authService';
import toast from 'react-hot-toast';

const OrderSelector = ({ 
  businessId, 
  selectedOrders, 
  onOrderToggle, 
  onSelectAll, 
  onClearSelection,
  searchQuery,
  onSearchChange,
  maxHeight = '400px'
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [businessId]);

  const loadOrders = async () => {
    if (!businessId) {
      console.log('OrderSelector: businessId is undefined, skipping load');
      return;
    }
    
    console.log('OrderSelector: Loading orders for businessId:', businessId);
    setLoading(true);
    try {
      const response = await api.get(`/management/manufacturer/orders/?business=${businessId}`);
      console.log('OrderSelector: API response:', response.data);
      
      const allOrders = response.data.results || response.data || [];
      console.log('OrderSelector: All orders:', allOrders);
      
      // Filter for orders that can be invoiced (completed, shipped, or delivered)
      const availableOrders = allOrders.filter(order => {
        const canInvoice = order.status === 'completed' || order.status === 'shipped' || order.status === 'delivered';
        console.log(`Order ${order.order_number}: status=${order.status}, canInvoice=${canInvoice}`);
        return canInvoice;
      });
      
      // Debug: Log all order statuses to see what we're getting
      console.log('OrderSelector: All order statuses:', allOrders.map(o => ({ 
        order_number: o.order_number, 
        status: o.status,
        customer: o.customer?.username || o.customer_name 
      })));
      
      console.log('OrderSelector: Available orders statuses:', availableOrders.map(o => ({ 
        order_number: o.order_number, 
        status: o.status,
        customer: o.customer?.username || o.customer_name 
      })));
      
      console.log('OrderSelector: Available orders for invoicing:', availableOrders);
      setOrders(availableOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Completed
          </span>
        );
      case 'shipped':
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            Shipped
          </span>
        );
      case 'delivered':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.data?.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalSelectedAmount = selectedOrders.reduce((sum, order) => 
    sum + (parseFloat(order.data?.amount || 0)), 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Orders to Invoice</h3>
          <p className="text-sm text-gray-600">
            Choose completed, shipped, or delivered orders to include in this invoice
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search orders by number, customer, or product..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Selected Orders Summary */}
      {selectedOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-sm text-blue-700 font-medium">
              Total: {formatCurrency(totalSelectedAmount)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders List */}
      <div className={`space-y-3 overflow-y-auto`} style={{ maxHeight }}>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders available</h3>
            <p className="text-gray-500">
              {searchQuery ? 'No orders match your search criteria' : 'Only completed, shipped, or delivered orders can be invoiced'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order) => {
              const isSelected = selectedOrders.find(o => o.id === order.id);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onOrderToggle(order)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Order #{order.order_number}
                        </h4>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.data?.amount || 0)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {order.customer?.username || order.customer_name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.created_at)}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      {order.data?.product_name && (
                        <p className="text-sm text-gray-500 mt-1">
                          {order.data.product_name}
                        </p>
                      )}
                      {order.data?.billing_address && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {order.data.billing_address}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Info Box */}
      {filteredOrders.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Invoice Generation Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Orders will be grouped by customer automatically</li>
                <li>• Line items will be generated from order details</li>
                <li>• You can modify line items after generation</li>
                <li>• Only completed, shipped, or delivered orders are available</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSelector; 