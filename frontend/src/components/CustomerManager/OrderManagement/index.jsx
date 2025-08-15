import React, { useEffect, useState } from 'react';
import { 
  FiPackage, 
  FiCalendar, 
  FiTruck, 
  FiUser, 
  FiCheckCircle, 
  FiClock, 
  FiArchive,
  FiSearch,
  FiFilter,
  FiDownload,
  FiInfo,
  FiEdit2,
  FiTrash2,
  FiHash,
  FiFileText,
  FiX,
  FiMapPin,
  FiMail,
  FiPhone,
  FiChevronDown,
  FiDollarSign,
  FiPlus
} from "react-icons/fi";
import { FaBoxOpen, FaCheck } from "react-icons/fa";
import api from '../../../services/authService';
import toast from 'react-hot-toast';
import { filterOrders } from '../../../utils/customerOrderUtils.jsx';
import OrderFilters from './OrderFilters';
import OrderCard from './OrderCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';
import NoFieldsModal from './NoFieldsModal';
import OrderCreator from '../modals/OrderCreation/OrderCreator';
import OrderPreviewModal from './OrderPreviewModal';

const OrderManagement = ({ 
  setActiveTab, 
  colors = { primary: '#3b82f6' }, 
  onPlaceOrderClick, 
  businessId, 
  searchQuery, 
  setSearchQuery 
}) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOrderConfirmed, setNewOrderConfirmed] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderFormFields, setOrderFormFields] = useState([]);
  const [orderFormLoading, setOrderFormLoading] = useState(false);
  const [showNoFieldsModal, setShowNoFieldsModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderCreator, setShowOrderCreator] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/management/customer/orders/");
      setOrders(res.data);
      
      // Check if there's a new order confirmation in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const newOrderId = urlParams.get('newOrder');
      if (newOrderId) {
        setNewOrderConfirmed(newOrderId);
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.error("Failed to fetch customer orders", err);
      const errorMessage = err.response?.data?.detail || "Failed to load orders. Please try again.";
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch digital order form fields on mount
  useEffect(() => {
    const fetchOrderFormFields = async () => {
      setOrderFormLoading(true);
      try {
        // TODO: Replace with actual order form fields API when available
        setOrderFormFields([]);
      } catch (err) {
        setOrderFormFields([]);
      } finally {
        setOrderFormLoading(false);
      }
    };
    fetchOrderFormFields();
  }, [businessId]);

  const filteredOrders = filterOrders(orders, searchQuery, statusFilter);

  // Helper function to get field icon based on field type
  const getFieldIcon = (fieldType) => {
    switch (fieldType) {
      case 'date':
        return <FiCalendar className="text-gray-400 mt-1 mr-3 flex-shrink-0" />;
      case 'number':
        return <FiHash className="text-gray-400 mt-1 mr-3 flex-shrink-0" />;
      case 'dropdown':
        return <FiChevronDown className="text-gray-400 mt-1 mr-3 flex-shrink-0" />;
      default:
        return <FiFileText className="text-gray-400 mt-1 mr-3 flex-shrink-0" />;
    }
  };

  // Helper function to format field value
  const formatFieldValue = (value, fieldType, fieldConfig) => {
    if (!value) return 'N/A';
    
    // Handle date fields with proper formatting
    if (fieldType === 'date') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
      return 'N/A';
    }
    
    // Handle currency fields with proper formatting
    if (fieldType === 'currency') {
      const currencySymbol = fieldConfig?.currency_symbol || '$';
      const decimalPlaces = fieldConfig?.decimal_places || 2;
      
      // Convert to number and format with currency symbol
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        return `${currencySymbol}${numericValue.toFixed(decimalPlaces)}`;
      }
    }
    
    return value;
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center";
    
    switch (status) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
            <FiClock className="mr-2" /> Pending
          </span>
        );
      case "in_production":
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700`}>
            <FiPackage className="mr-2" /> In Production
          </span>
        );
      case "shipped":
        return (
          <span className={`${baseClasses} bg-purple-50 text-purple-700`}>
            <FiTruck className="mr-2" /> Shipped
          </span>
        );
      case "completed":
        return (
          <span className={`${baseClasses} bg-green-50 text-green-700`}>
            <FiCheckCircle className="mr-2" /> Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-50 text-gray-700`}>
            <FiArchive className="mr-2" /> {status}
          </span>
        );
    }
  };

  // Format date to relative time or specific format
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
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

  const canEditOrder = (status) => {
    // Only allow editing if the order is in 'pending' status
    return status === 'pending';
  };

  const handleOrderClick = (order) => {
    console.log('Order clicked:', order);
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const handleEditOrder = (order) => {
    console.log('Edit order clicked:', order);
    console.log('Order data:', order.data);
    setEditingOrder(order);
    setShowEditForm(true);
  };

  const handleEditSubmit = async (formData) => {
    try {
      console.log('Submitting edit with data:', formData);
      console.log('Editing order ID:', editingOrder.id);
      
      await api.patch(`/management/customer/orders/${editingOrder.id}/`, {
        template_type: "order",
        data: formData
      });
      
      // Refresh orders after successful edit
      const res = await api.get("/management/customer/orders/");
      setOrders(res.data);
      setShowEditForm(false);
      setEditingOrder(null);
      
      // Show success toast
      toast.success('Order updated successfully!', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (err) {
      console.error("Failed to update order", err);
      console.error("Error response:", err.response?.data);
      // Show error toast
      toast.error('Failed to update order. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    const toastId = toast.loading('Deleting order...', {
      position: 'top-right',
      duration: 5000,
    });

    try {
      await api.delete(`/management/customer/orders/${orderToDelete.id}/`);
      
      // Refresh orders after successful deletion
      const res = await api.get("/management/customer/orders/");
      setOrders(res.data);
      
      // Update toast to success
      toast.success('Order deleted successfully!', {
        id: toastId,
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
        icon: '🗑️',
      });
    } catch (err) {
      console.error("Failed to delete order", err);
      // Update toast to error
      toast.error('Failed to delete order. Please try again.', {
        id: toastId,
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
        icon: '❌',
      });
    } finally {
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  const handleDownloadPDF = async (order) => {
    try {
      console.log("Downloading PDF for order:", order);
      // For now, just show a success message
      // TODO: Implement actual PDF download functionality
      toast.success('PDF download started!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error('Failed to download PDF', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderToConfirm) return;

    const toastId = toast.loading('Confirming delivery...', {
      position: 'top-right',
      duration: 5000,
    });

    try {
      await api.post(`/management/customer/orders/${orderToConfirm.id}/confirm-delivery/`);
      
      // Refresh orders after successful confirmation
      const res = await api.get("/management/customer/orders/");
      setOrders(res.data);
      
      // Update toast to success
      toast.success('Delivery confirmed successfully!', {
        id: toastId,
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
        icon: '✅',
      });
    } catch (err) {
      console.error("Failed to confirm delivery", err);
      const errorMessage = err.response?.data?.detail || 'Failed to confirm delivery. Please try again.';
      // Update toast to error
      toast.error(errorMessage, {
        id: toastId,
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
        icon: '❌',
      });
    } finally {
      setShowDeliveryModal(false);
      setOrderToConfirm(null);
    }
  };

  // Place Order button handler (to be called from header)
  const handlePlaceOrder = () => {
    setShowOrderCreator(true);
  };

  // Expose handler to parent/header
  useEffect(() => {
    if (onPlaceOrderClick) {
      onPlaceOrderClick.current = handlePlaceOrder;
    }
  }, [orderFormFields]);

  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      .scrollbar-thin {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        
        <OrderFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filteredOrders={filteredOrders}
          orders={orders}
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FiPackage className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              {searchQuery || statusFilter !== "all" ? "No orders found" : "No orders yet"}
            </h3>
            <p className="text-gray-500 mt-2 mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Start by creating your first order to track your business transactions."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => setShowOrderCreator(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <FiPlus className="mr-2" />
                Create Your First Order
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                newOrderConfirmed={newOrderConfirmed}
                onOrderClick={handleOrderClick}
                onEdit={handleEditOrder}
                onDelete={handleDeleteClick}
                onConfirmDelivery={(order) => {
                  setOrderToConfirm(order);
                  setShowDeliveryModal(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Edit Order Modal */}
        {showEditForm && editingOrder && (
          <OrderCreator
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false);
              setEditingOrder(null);
            }}
            businessId={businessId}
            isEdit={true}
            editingOrder={editingOrder}
            onOrderUpdated={() => {
              // Refresh orders after successful update
              fetchOrders();
              setShowEditForm(false);
              setEditingOrder(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          orderToDelete={orderToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setOrderToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />

        {/* Delivery Confirmation Modal */}
        <DeliveryConfirmationModal
          orderToConfirm={orderToConfirm}
          onClose={() => {
            setShowDeliveryModal(false);
            setOrderToConfirm(null);
          }}
          onConfirm={handleConfirmDelivery}
        />

        {/* OrderCreator Modal */}
        {showOrderCreator && (
          <OrderCreator
            isOpen={showOrderCreator}
            onClose={() => setShowOrderCreator(false)}
            businessId={businessId}
            onOrderCreated={() => {
              // Refresh orders after successful creation
              fetchOrders();
            }}
          />
        )}

        {/* Order Preview Modal */}
        {showOrderDetailsModal && selectedOrder && (
          <OrderPreviewModal
            order={selectedOrder}
            orderFormFields={orderFormFields}
            onClose={() => {
              setShowOrderDetailsModal(false);
              setSelectedOrder(null);
            }}
            onEdit={(order) => {
              setShowOrderDetailsModal(false);
              setSelectedOrder(null);
              handleEditOrder(order);
            }}
            onDelete={(order) => {
              setShowOrderDetailsModal(false);
              setSelectedOrder(null);
              handleDeleteClick(order);
            }}
            onDownload={handleDownloadPDF}
            orderType={selectedOrder?.order_type}
            onConfirmDelivery={(order) => {
              setShowOrderDetailsModal(false);
              setSelectedOrder(null);
              setOrderToConfirm(order);
              setShowDeliveryModal(true);
            }}
            canEditOrder={canEditOrder}
            formatDate={formatDate}
            formatFieldValue={formatFieldValue}
            getFieldIcon={getFieldIcon}
            getStatusBadge={getStatusBadge}
          />
        )}

        {/* No Fields Modal */}
        <NoFieldsModal
          isOpen={showNoFieldsModal}
          onClose={() => setShowNoFieldsModal(false)}
          onGoToSettings={() => {
            setShowNoFieldsModal(false);
            if (setActiveTab) setActiveTab('settings');
          }}
          colors={colors}
        />
      </div>
    </div>
  );
};

export default OrderManagement;

