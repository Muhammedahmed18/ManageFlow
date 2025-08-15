import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/authService';
import { filterOrders } from '../../../utils/orderUtils.jsx';
import OrderFilters from './OrderFilters';
import OrderTable from './OrderTable';
import OrderDetailsModal from './OrderDetailsModal';

const OrderManagement = ({ 
  orders, 
  colors,
  onOrderUpdate,
  setOrders
}) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await api.patch(`/management/manufacturer/orders/${orderId}/`, {
        status: newStatus
      });

      // Update the order in local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success('Order status updated successfully!', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
        icon: '✅',
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.error('Order not found. It may have been deleted or is not accessible.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
          icon: '❌',
        });
      } else {
        toast.error('Failed to update order status', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
          icon: '❌',
        });
      }
      console.error('Failed to update order status:', err);
    } finally {
      setLoading(false);
      setOpenDropdownId(null);
    }
  };

  const filteredOrders = filterOrders(orders, searchTerm, statusFilter);

  // Add dropdown animation keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dropdown-fade {
        from { opacity: 0; transform: translateY(-8px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-dropdown-fade { animation: dropdown-fade 0.18s cubic-bezier(0.4,0,0.2,1); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Dropdown open state
  const handleDropdownOpen = (orderId) => setOpenDropdownId(openDropdownId === orderId ? null : orderId);
  const handleDropdownChange = (orderId, status) => {
    handleStatusChange(orderId, status);
    setOpenDropdownId(null);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        <OrderFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        
        <OrderTable
          filteredOrders={filteredOrders}
          openDropdownId={openDropdownId}
          onDropdownOpen={handleDropdownOpen}
          onDropdownChange={handleDropdownChange}
          onOrderClick={handleOrderClick}
        />
        
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderManagement;

