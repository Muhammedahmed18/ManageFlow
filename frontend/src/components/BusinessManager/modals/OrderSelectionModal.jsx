import React, { useState, useEffect } from 'react';
import { X, Check, Package, Calendar, User, DollarSign } from 'lucide-react';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const OrderSelectionModal = ({ 
  isOpen, 
  onClose, 
  onOrdersSelected, 
  businessId 
}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && businessId) {
      fetchDeliveredOrders();
    }
  }, [isOpen, businessId]);

  const fetchDeliveredOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders that are delivered or completed and don't have invoices yet
      const response = await api.get(`/management/manufacturer/orders/?business=${businessId}&status=delivered,completed&no_invoice=true`);
      setOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      toast.error('Failed to load delivered orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrders(prev => {
      const isSelected = prev.find(o => o.id === order.id);
      if (isSelected) {
        return prev.filter(o => o.id !== order.id);
      } else {
        return [...prev, order];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders([...filteredOrders]);
    }
  };

  const handleCreateInvoice = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order');
      return;
    }
    onOrdersSelected(selectedOrders);
    onClose();
  };

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateOrderTotal = (order) => {
    // Extract total from order data if available
    if (order.data && order.data.total) {
      return parseFloat(order.data.total);
    }
    // Fallback calculation based on order data
    if (order.data && order.data.items) {
      return order.data.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return sum + (quantity * price);
      }, 0);
    }
    return 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Orders for Invoice</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose delivered orders to create an invoice
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search orders by number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {selectedOrders.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedOrders.length} of {filteredOrders.length} selected
              </span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-4xl text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No delivered orders found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? "Try adjusting your search criteria" : "All delivered orders may already have invoices"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrders.find(o => o.id === order.id);
                const orderTotal = calculateOrderTotal(order);
                
                return (
                  <div
                    key={order.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleOrderSelect(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              Order #{order.order_number}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'delivered' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{order.customer?.username || 'Unknown Customer'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(orderTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedOrders.length > 0 && (
                <span>
                  Total: {formatCurrency(selectedOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0))}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={selectedOrders.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Invoice ({selectedOrders.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSelectionModal;
