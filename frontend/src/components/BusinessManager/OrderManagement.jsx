import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  ChevronDown, ChevronUp, 
  Calendar, Package, Check, Clock, Truck,
  User, FileText, Hash, AlertCircle,
  MoreVertical, Edit2, Trash2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/authService';

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

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center";
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
            <Clock size={16} className="mr-2" />
            Pending
          </span>
        );
      case 'in_production':
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700`}>
            <Package size={16} className="mr-2" />
            In Production
          </span>
        );
      case 'shipped':
        return (
          <span className={`${baseClasses} bg-purple-50 text-purple-700`}>
            <Truck size={16} className="mr-2" />
            Shipped
          </span>
        );
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-50 text-green-700`}>
            <Check size={16} className="mr-2" />
            Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-50 text-gray-700`}>
            <AlertCircle size={16} className="mr-2" />
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const StatusDropdown = ({ order, isOpen, onOpen, onChange }) => {
    const buttonRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);

    // Calculate position when opened
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handleClick = (e) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(e.target)
        ) {
          onOpen(); // toggles closed
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onOpen]);

    // Dropdown menu
    const dropdownMenu = isOpen ? ReactDOM.createPortal(
      <div
        ref={dropdownRef}
        className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg animate-dropdown-fade"
        style={{
          position: 'absolute',
          top: dropdownPos.top,
          left: dropdownPos.left,
          minWidth: dropdownPos.width,
          width: 192 // 12rem
        }}
      >
        <button onClick={() => onChange('pending')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Clock className="text-yellow-500" size={16} /> Pending
        </button>
        <button onClick={() => onChange('in_production')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Package className="text-blue-500" size={16} /> In Production
        </button>
        <button onClick={() => onChange('shipped')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Truck className="text-purple-500" size={16} /> Shipped
        </button>
        <button onClick={() => onChange('completed')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Check className="text-green-500" size={16} /> Delivered
        </button>
      </div>,
      document.body
    ) : null;

    return (
      <>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all focus:outline-none ${isOpen ? 'ring-2 ring-blue-400' : ''}`}
        >
          {getStatusBadge(order.status)}
          <ChevronDown className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        {dropdownMenu}
      </>
    );
  };

  const OrderDetailsModal = ({ order, onClose }) => (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Order Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Order No</p>
                  <p className="font-medium">{order.order_number || order.data?.order_id || order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{order.data?.product || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Return Date</p>
                  <p className="font-medium">{order.data?.return_date || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{order.data?.customer || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{order.data?.notes || "No notes"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Additional Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(order.data).map(([key, value]) => {
                if (!['order_id', 'order_number', 'product', 'return_date', 'customer', 'notes'].includes(key)) {
                  return (
                    <div key={key}>
                      <p className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                      <p className="font-medium">{value || "N/A"}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.data?.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.data?.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Order Management</h1>
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Order No</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-100 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.order_number || order.data?.order_id || order.id}</td>
                  <td className="px-6 py-4">{order.data?.product || 'N/A'}</td>
                  <td className="px-6 py-4">{order.data?.customer || 'N/A'}</td>
                  <td className="px-6 py-4">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4">
                    <StatusDropdown
                      order={order}
                      isOpen={openDropdownId === order.id}
                      onOpen={() => handleDropdownOpen(order.id)}
                      onChange={status => handleDropdownChange(order.id, status)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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