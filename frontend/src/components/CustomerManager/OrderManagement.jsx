import React, { useEffect, useState } from "react";
import api from "../../services/authService";
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
  FiDollarSign
} from "react-icons/fi";
import { FaBoxOpen, FaCheck } from "react-icons/fa";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

import OrderCreator from "./modals/OrderCreation/OrderCreator";


import toast from 'react-hot-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Order Preview Modal Component
const OrderPreviewModal = ({ order, orderFormFields, onClose, onEdit, onDelete, onDownload, onConfirmDelivery, canEditOrder, formatDate, formatFieldValue, getFieldIcon, getStatusBadge, orderType }) => {
  const [activeTab, setActiveTab] = useState('product'); // Start with Product Details tab
  const [productData, setProductData] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  
  // Helper function to safely create dates
  const safeDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };
  
  if (!order) return null;

  // Fetch product data when Product Details tab is active
  useEffect(() => {
    if (activeTab === 'product' && order.data?.product && !productData) {
      fetchProductData();
    }
  }, [activeTab, order.data?.product]);

  const fetchProductData = async () => {
    setLoadingProduct(true);
    try {
      const response = await api.get(`/management/customer/products/?search=${encodeURIComponent(order.data.product)}`);
      if (response.data && response.data.length > 0) {
        // Find the exact product match
        const exactProduct = response.data.find(p => p.name === order.data.product);
        setProductData(exactProduct || response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch product data:', error);
    } finally {
      setLoadingProduct(false);
    }
  };

  // Filter product-specific fields (exclude order-specific fields)
  const getProductFields = (data) => {
    const orderFields = ['sent_by', 'customer', 'return_date', 'order_date', 'quantity', 'special_instructions'];
    return Object.entries(data || {}).filter(([key, value]) => 
      !orderFields.includes(key) && value && value !== 'N/A' && value !== ''
    );
  };

  // Helper function to get field value with aliases
  const getFieldValue = (data, key, label) => {
    // Handle sent by field
    if (label.toLowerCase().includes('sent by')) {
      return data?.sent_by || 'N/A';
    }
    
    // Handle customer field
    if (label.toLowerCase().includes('customer') && !label.toLowerCase().includes('sent by')) {
      return data?.customer || 'N/A';
    }
    
    // Handle return date aliases
    if (label.toLowerCase().includes('return')) {
      return data?.return_date || data?.returnDate || 'N/A';
    }
    
    // Handle order date aliases
    if (label.toLowerCase().includes('order date')) {
      return data?.order_date || data?.orderDate || 'N/A';
    }
    
    // Default to direct key lookup
    return data?.[key] || 'N/A';
  };

  // Group fields by category for better organization
  const getFieldGroups = () => {
    if (orderFormFields.length === 0) {
      return {
        'Basic Info': [
          { key: 'product', label: 'Product', type: 'text', value: order.data?.product },
          { key: 'quantity', label: 'Quantity', type: 'number', value: order.data?.quantity },
          { key: 'material', label: 'Material', type: 'text', value: order.data?.material }
        ],
        'Additional Info': [
          { key: 'return_date', label: 'Return Date', type: 'date', value: order.data?.return_date },
          { key: 'customer', label: 'Customer Name', type: 'text', value: order.data?.customer },
          { key: 'notes', label: 'Additional Notes', type: 'text', value: order.data?.notes }
        ]
      };
    }

    // Group dynamic fields - first 3 go to Basic Info, rest to Additional Info
    const basicFields = orderFormFields.slice(0, 3)
      .filter(
        field =>
          field.key !== 'order_id' &&
          field.key !== 'order_number' &&
          field.key !== 'order_no' &&
          field.label.toLowerCase().includes('order') === false
      )
      .map(field => ({
        key: field.key,
        label: field.label,
        type: field.type,
        value: getFieldValue(order.data, field.key, field.label)
      }));

    const additionalFields = orderFormFields.slice(3)
      .filter(
        field =>
          field.key !== 'order_id' &&
          field.key !== 'order_number' &&
          field.key !== 'order_no' &&
          field.label.toLowerCase().includes('order') === false
      )
      .map(field => ({
        key: field.key,
        label: field.label,
        type: field.type,
        value: getFieldValue(order.data, field.key, field.label)
      }));

    return {
      'Basic Info': basicFields,
      'Additional Info': additionalFields
    };
  };

  const fieldGroups = getFieldGroups();

  // Get timeline entries based on actual status history
  const getTimelineEntries = () => {
    const entries = [];
    
    // Helper function to safely create dates
    const safeDate = (dateString) => {
      if (!dateString) return new Date();
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    };
    
    // Helper function to format date safely
    const formatTimelineDate = (date) => {
      try {
        return date.toLocaleString();
      } catch (error) {
        return new Date().toLocaleString();
      }
    };
    
    // Use actual status history if available
    if (order.status_history && order.status_history.length > 0) {
      // Sort by changed_at in ascending order (oldest first)
      const sortedHistory = [...order.status_history].sort((a, b) => 
        new Date(a.changed_at) - new Date(b.changed_at)
      );
      
      sortedHistory.forEach((historyEntry, index) => {
        const statusDate = safeDate(historyEntry.changed_at);
        let title = '';
        let color = '';
        
        switch (historyEntry.status) {
          case 'pending':
            title = 'Order Placed (pending)';
            color = 'green';
            break;
          case 'in_production':
            title = 'Order Confirmed (In Production)';
            color = 'blue';
            break;
          case 'shipped':
            title = 'Order Shipped';
            color = 'purple';
            break;
          case 'completed':
            title = 'Order Delivered';
            color = 'green';
            break;
          default:
            title = `Status: ${historyEntry.status_display || historyEntry.status}`;
            color = 'gray';
        }
        
        entries.push({
          status: historyEntry.status,
          title: title,
          time: formatTimelineDate(statusDate),
          color: color,
          notes: historyEntry.notes
        });
      });
    } else {
      // Fallback to the old method if no status history is available
      const createdDate = safeDate(order.created_at);
      const updatedDate = safeDate(order.updated_at);
      
      // Always show order placed with "pending" status
      entries.push({
        status: 'placed',
        title: 'Order Placed (pending)',
        time: formatTimelineDate(createdDate),
        color: 'green'
      });

      // Add status-specific entries based on current status with progressive timestamps
      if (order.status !== 'pending') {
        const statusChangeTime = updatedDate.getTime() !== createdDate.getTime()
          ? updatedDate
          : new Date(createdDate.getTime() + 60000); // Add 1 minute if no updated_at
        
        entries.push({
          status: 'confirmed',
          title: 'Order Confirmed (In Production)',
          time: formatTimelineDate(statusChangeTime),
          color: 'blue'
        });
      }

      if (order.status === 'shipped' || order.status === 'completed') {
        const statusChangeTime = updatedDate.getTime() !== createdDate.getTime()
          ? new Date(updatedDate.getTime() + 30000) // Add 30 seconds to updated_at
          : new Date(createdDate.getTime() + 120000); // Add 2 minutes if no updated_at
        
        entries.push({
          status: 'shipped',
          title: 'Order Shipped',
          time: formatTimelineDate(statusChangeTime),
          color: 'purple'
        });
      }

      if (order.status === 'completed') {
        const statusChangeTime = updatedDate.getTime() !== createdDate.getTime()
          ? new Date(updatedDate.getTime() + 60000) // Add 60 seconds to updated_at
          : new Date(createdDate.getTime() + 180000); // Add 3 minutes if no updated_at
        
        entries.push({
          status: 'delivered',
          title: 'Order Delivered',
          time: formatTimelineDate(statusChangeTime),
          color: 'green'
        });
      }
    }

    return entries;
  };

  const timelineEntries = getTimelineEntries();

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order #{order.order_number}</h2>
              <p className="text-sm text-gray-600 mt-1">
                <FiCalendar className="inline mr-1" />
                {formatDate(order.created_at)} • {safeDate(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6">
            {/* Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                {getStatusBadge(order.status)}
                <span className="text-sm text-gray-600">
                  Last updated: {safeDate(order.updated_at || order.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('product')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'product'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Product Details
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Order Details
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'timeline'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Timeline
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'product' && (
              <div className="space-y-6">
                {loadingProduct ? (
                  <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading product details...</p>
                  </div>
                ) : productData ? (
                  <>
                    {/* Product Image and Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Image */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <FiPackage className="mr-2 text-gray-600" />
                          Product Image
                        </h3>
                        <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {productData.image_url ? (
                            <img 
                              src={productData.image_url} 
                              alt={productData.name} 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FiPackage className="w-20 h-20 text-gray-400" />
                          )}
                        </div>
                        <div className="mt-4 text-center">
                          <h4 className="text-xl font-semibold text-gray-900">{productData.name}</h4>
                          {productData.custom_id && (
                            <p className="text-sm text-gray-500 mt-1">ID: {productData.custom_id}</p>
                          )}
                        </div>
                      </div>

                      {/* Product Specifications */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <FiFileText className="mr-2 text-gray-600" />
                          Product Specifications
                        </h3>
                        {productData.field_values && productData.field_values.length > 0 ? (
                          <div className="space-y-4">
                            {productData.field_values.map((fieldValue, index) => (
                              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                  {getFieldIcon(fieldValue.field.type)}
                                  <span className="text-sm font-medium text-gray-700">{fieldValue.field.label}</span>
                                </div>
                                <p className="text-base font-semibold text-gray-900">
                                  {formatFieldValue(fieldValue.value, fieldValue.field.type, fieldValue.field)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No specifications available for this product.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No product data found for this order.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Form Fields */}
                {Object.entries(fieldGroups).map(([groupName, fields]) => (
                  <div key={groupName}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <FiPackage className="mr-2 text-gray-600" />
                      {groupName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fields.map((field) => (
                        <div key={field.key} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            {getFieldIcon(field)}
                            <span className="text-sm font-medium text-gray-700">{field.label}</span>
                          </div>
                          <p className="text-base font-semibold text-gray-900">
                            {formatFieldValue(field.value, field.type, field)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FiClock className="mr-2 text-gray-600" />
                  Order Timeline
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {timelineEntries.map((entry, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-2 h-2 bg-${entry.color}-500 rounded-full mr-3`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                          <p className="text-sm text-gray-600">{entry.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Download PDF Button */}
              <button
                onClick={() => onDownload(order)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                <FiDownload className="mr-2" />
                Download PDF
              </button>

              {/* Edit Button */}
              {canEditOrder(order.status) && (
                <button
                  onClick={() => onEdit(order)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Order
                </button>
              )}

              {/* Delete Button */}
              {canEditOrder(order.status) && (
                <button
                  onClick={() => onDelete(order)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center"
                >
                  <FiTrash2 className="mr-2" />
                  Delete Order
                </button>
              )}

              {/* Confirm Delivery Button */}
              {order.status === "shipped" && (
                <button
                  onClick={() => onConfirmDelivery(order)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <FaCheck className="inline mr-2" />
                  Confirm Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const OrderManagement = ({ setActiveTab, colors = { primary: '#3b82f6' }, onPlaceOrderClick, businessId, searchQuery, setSearchQuery }) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Helper function to get field value with aliases
  const getFieldValue = (data, key, label) => {
    // Handle sent by field
    if (label.toLowerCase().includes('sent by')) {
      return data?.sent_by || 'N/A';
    }
    
    // Handle customer field
    if (label.toLowerCase().includes('customer') && !label.toLowerCase().includes('sent by')) {
      return data?.customer || 'N/A';
    }
    
    // Handle return date aliases
    if (label.toLowerCase().includes('return')) {
      return data?.return_date || data?.returnDate || 'N/A';
    }
    
    // Handle order date aliases
    if (label.toLowerCase().includes('order date')) {
      return data?.order_date || data?.orderDate || 'N/A';
    }
    
    // Default to direct key lookup
    return data?.[key] || 'N/A';
  };

  // Helper function to get display fields for the order card
  const getDisplayFields = (order) => {
    // If we have order form fields, use them to determine what to display
    if (orderFormFields.length > 0) {
      // Get the first 3 fields to display in the main card
      const displayFields = orderFormFields.slice(0, 3).map(field => ({
        key: field.key,
        label: field.label,
        type: field.type,
        value: getFieldValue(order.data, field.key, field.label)
      }));
      
      // If we have fewer than 3 fields, add some defaults
      while (displayFields.length < 3) {
        if (displayFields.length === 0) {
          displayFields.push({
            key: 'product',
            label: 'Product',
            type: 'text',
            value: order.data?.product
          });
        } else if (displayFields.length === 1) {
          displayFields.push({
            key: 'material',
            label: 'Material',
            type: 'text',
            value: order.data?.material
          });
        } else {
          displayFields.push({
            key: 'quantity',
            label: 'Quantity',
            type: 'number',
            value: order.data?.quantity
          });
        }
      }
      
      return displayFields;
    }
    
    // Fallback to hardcoded fields if no form fields are available
    return [
      {
        key: 'product',
        label: 'Product',
        type: 'text',
        value: order.data?.product
      },
      {
        key: 'order_date',
        label: 'Order Date',
        type: 'date',
        value: order.data?.order_date
      },
      {
        key: 'return_date',
        label: 'Return Date',
        type: 'date',
        value: order.data?.return_date
      },
      {
        key: 'sent_by',
        label: 'Sent By',
        type: 'text',
        value: order.data?.sent_by || 'N/A'
      },
      {
        key: 'customer',
        label: 'Customer',
        type: 'text',
        value: order.data?.customer || 'N/A'
      }
    ];
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

  // Use searchQuery from props for filtering
  const filteredOrders = orders.filter(order => {
    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id.toString().includes(searchQuery) ||
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.data?.sent_by?.toLowerCase().includes(searchLower) ||
      order.data?.customer?.toLowerCase().includes(searchLower) ||
      // Search through all order data fields
      Object.values(order.data || {}).some(value => 
        value?.toString().toLowerCase().includes(searchLower)
      );
    // Apply status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.text("Your Orders", 14, 16);
    
    // Create dynamic headers based on form fields
    const headers = ['Order No', 'Status', 'Order Date'];
    if (orderFormFields.length > 0) {
      // Add first 2 form fields to headers
      orderFormFields.slice(0, 2).forEach(field => {
        headers.push(field.label);
      });
    } else {
      // Fallback to hardcoded headers
      headers.push('Product', 'Return Date');
    }
    
    // Create table body
    const body = filteredOrders.map(order => {
      const row = [
        order.order_number || order.data?.order_id || order.id,
        getStatusText(order.status),
        new Date(order.created_at).toLocaleDateString()
      ];
      
      if (orderFormFields.length > 0) {
        // Add first 2 form field values
        orderFormFields.slice(0, 2).forEach(field => {
          row.push(formatFieldValue(getFieldValue(order.data, field.key, field.label), field.type, field));
        });
      } else {
        // Fallback to hardcoded values
        row.push(
          order.data?.product || 'N/A',
          order.data?.return_date || 'N/A'
        );
      }
      
      return row;
    });
    
    // Add table
    doc.autoTable({
      head: [headers],
      body: body,
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      }
    });
    
    doc.save('orders.pdf');
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_production": return "In Production";
      case "shipped": return "Shipped";
      case "completed": return "Delivered";
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return rgb(0.8, 0.6, 0.2); // Orange
      case 'in_production': return rgb(0.2, 0.4, 0.8); // Blue
      case 'shipped': return rgb(0.2, 0.6, 0.8); // Light blue
      case 'completed': return rgb(0.2, 0.8, 0.2); // Green
      case 'cancelled': return rgb(0.8, 0.2, 0.2); // Red
      default: return rgb(0.3, 0.3, 0.3); // Gray
    }
  };

  const handleEditOrder = (order) => {
    console.log('Edit order clicked:', order);
    console.log('Order data:', order.data);
    setEditingOrder(order);
      setShowEditForm(true);
  };



  const canEditOrder = (status) => {
    // Only allow editing if the order is in 'pending' status
    return status === 'pending';
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

  const handleDownloadPDF = async (order) => {
    try {
        console.log("Downloading PDF for order:", order);

        // --- Helper Functions and Constants ---
        const getStatusColor = (status) => {
            const statusColors = {
                'pending': rgb(1, 0.7, 0.1),
                'processing': rgb(0.2, 0.6, 1),
                'completed': rgb(0.2, 0.8, 0.3),
                'cancelled': rgb(0.9, 0.3, 0.3),
                'draft': rgb(0.6, 0.6, 0.6),
            };
            return statusColors[status?.toLowerCase()] || rgb(0.5, 0.5, 0.5);
        };

        const getStatusText = (status) => {
            const statusTexts = {
                'pending': 'Pending Review',
                'processing': 'In Progress',
                'completed': 'Completed',
                'cancelled': 'Cancelled',
                'draft': 'Draft',
            };
            return statusTexts[status?.toLowerCase()] || status || 'Status Unknown';
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            } catch (error) {
                return dateString;
            }
        };

        const wrapText = (text, maxWidth, font, fontSize) => {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';
            for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testWidth = font.widthOfTextAtSize(testLine, fontSize);
                if (testWidth <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            return lines;
        };
        // --- End of Helper Functions and Constants ---

        // --- Fetch and Setup ---
        // Try multiple sources for business ID with fallbacks
        const orderBusinessId = order.business_id || order.business?.id || businessId;
        console.log("Order business ID resolution:", {
            orderBusinessId,
            orderBusinessIdFromField: order.business_id,
            orderBusinessIdFromObject: order.business?.id,
            componentBusinessId: businessId
        });
        let businessInfo = null;

        if (orderBusinessId) {
            try {
                const businessResponse = await api.get(`/management/customer/business/${orderBusinessId}/`);
                businessInfo = businessResponse.data;
            } catch (error) {
                console.warn("Could not fetch business information:", error);
            }
        } else {
            console.warn("No businessId found for this order. Using default business information.");
        }

        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595.28, 841.89]);

        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const primaryColor = rgb(0.15, 0.35, 0.7);
        const secondaryColor = rgb(0.25, 0.25, 0.25);
        const accentColor = rgb(0.05, 0.05, 0.05);
        const lightGray = rgb(0.95, 0.95, 0.95);
        const tableHeaderColor = rgb(0.2, 0.4, 0.8);
        const tableBorderColor = rgb(0.7, 0.7, 0.7);
        const alternateRowColor = rgb(0.98, 0.98, 0.98);

        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);

        let yPosition = pageHeight - margin;

        // --- Header Section ---
        const drawHeader = (currentPage) => {
            const headerHeight = 70;
            let headerY = pageHeight - margin;

            currentPage.drawRectangle({
                x: margin,
                y: headerY - headerHeight,
                width: contentWidth,
                height: headerHeight,
                color: lightGray,
                borderColor: tableBorderColor,
                borderWidth: 0.5,
            });

            // Dynamically set business name with a fallback
            const businessName = businessInfo?.name || "ManageFlow Business";
            
            currentPage.drawText(businessName, {
                x: margin + 20,
                y: headerY - 20,
                size: 18,
                font: helveticaBoldFont,
                color: primaryColor,
            });

            currentPage.drawText("ORDER DETAILS REPORT", {
                x: margin + 20,
                y: headerY - 40,
                size: 12,
                font: helveticaBoldFont,
                color: accentColor,
            });

            currentPage.drawText(`Generated: ${new Date().toLocaleString()}`, {
                x: pageWidth - margin - 150,
                y: headerY - 20,
                size: 8,
                font: helveticaFont,
                color: secondaryColor,
            });
            return headerY - headerHeight - 20;
        };

        yPosition = drawHeader(page);

        // --- Order Summary Section ---
        const summaryTitle = "Order Summary";
        page.drawText(summaryTitle, {
            x: margin,
            y: yPosition,
            size: 14,
            font: helveticaBoldFont,
            color: primaryColor,
        });
        yPosition -= 20;

        const summaryCardHeight = 80;
        const summaryCardY = yPosition - summaryCardHeight;

        page.drawRectangle({
            x: margin,
            y: summaryCardY,
            width: contentWidth,
            height: summaryCardHeight,
            borderColor: tableBorderColor,
            borderWidth: 1,
            color: rgb(1, 1, 1),
        });

        const statusText = getStatusText(order.status);
        const statusBadgeWidth = helveticaBoldFont.widthOfTextAtSize(statusText, 10) + 20;
        const statusBadgeHeight = 20;
        const statusBadgeX = pageWidth - margin - statusBadgeWidth - 10;
        const statusBadgeY = yPosition - 10;

        page.drawRectangle({
            x: statusBadgeX,
            y: statusBadgeY - statusBadgeHeight,
            width: statusBadgeWidth,
            height: statusBadgeHeight,
            color: getStatusColor(order.status),
        });

        page.drawText(statusText, {
            x: statusBadgeX + 10,
            y: statusBadgeY - 14,
            size: 10,
            font: helveticaBoldFont,
            color: rgb(1, 1, 1),
        });

        const orderInfo = [
            { label: "Order Number", value: order.order_number || order.id },
            { label: "Order Date", value: formatDate(order.created_at) },
            { label: "Last Updated", value: formatDate(order.updated_at || order.created_at) },
        ];

        const gridStartY = yPosition - 35;
        const gridItemWidth = (contentWidth - 20) / 3;

        orderInfo.forEach((item, index) => {
            const x = margin + 10 + (index * gridItemWidth);
            page.drawText(`${item.label}:`, {
                x: x,
                y: gridStartY,
                size: 9,
                font: helveticaBoldFont,
                color: secondaryColor,
            });

            page.drawText(item.value, {
                x: x,
                y: gridStartY - 12,
                size: 9,
                font: helveticaFont,
                color: accentColor,
            });
        });

        yPosition -= summaryCardHeight + 30;

        // --- Order Details Table ---
        if (order.data && Object.keys(order.data).length > 0) {
            const validEntries = Object.entries(order.data).filter(([key, value]) =>
                value && value !== 'N/A' && value !== '' && String(value).trim() !== ''
            );

            if (validEntries.length > 0) {
                page.drawText("Order Details", {
                    x: margin,
                    y: yPosition,
                    size: 14,
                    font: helveticaBoldFont,
                    color: primaryColor,
                });

                yPosition -= 20;
                const tableHeaderHeight = 25;
                const fieldColumnWidth = contentWidth * 0.4;
                const valueColumnWidth = contentWidth * 0.6;
                const rowPadding = 10;
                const textHeight = 9;

                const drawTableHeaders = (currentPage, y) => {
                    currentPage.drawRectangle({
                        x: margin,
                        y: y - tableHeaderHeight,
                        width: contentWidth,
                        height: tableHeaderHeight,
                        color: tableHeaderColor,
                    });
                    currentPage.drawText("FIELD NAME", {
                        x: margin + 10,
                        y: y - tableHeaderHeight + 8,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(1, 1, 1),
                    });
                    currentPage.drawText("VALUE", {
                        x: margin + fieldColumnWidth + 10,
                        y: y - tableHeaderHeight + 8,
                        size: 10,
                        font: helveticaBoldFont,
                        color: rgb(1, 1, 1),
                    });
                    return y - tableHeaderHeight;
                };

                yPosition = drawTableHeaders(page, yPosition);

                validEntries.forEach((entry, index) => {
                    const [key, value] = entry;
                    const isEvenRow = index % 2 === 0;
                    const rowColor = isEvenRow ? rgb(1, 1, 1) : alternateRowColor;

                    const fieldName = key.replace(/_/g, ' ').replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).trim();
                    const displayValue = String(value).trim();
                    const wrappedLines = wrapText(displayValue, valueColumnWidth - (rowPadding * 2), helveticaFont, textHeight);
                    const rowHeight = Math.max(25, (wrappedLines.length * textHeight) + (rowPadding * 2));

                    if (yPosition - rowHeight < margin + 50) {
                        page = pdfDoc.addPage([595.28, 841.89]);
                        yPosition = drawHeader(page);
                        yPosition -= 20;
                        yPosition = drawTableHeaders(page, yPosition);
                    }

                    page.drawRectangle({
                        x: margin,
                        y: yPosition - rowHeight,
                        width: contentWidth,
                        height: rowHeight,
                        color: rowColor,
                        borderColor: tableBorderColor,
                        borderWidth: 0.5,
                    });

                    page.drawText(fieldName, {
                        x: margin + 10,
                        y: yPosition - (rowHeight / 2) - (textHeight / 2),
                        size: textHeight,
                        font: helveticaBoldFont,
                        color: secondaryColor,
                    });

                    wrappedLines.forEach((line, lineIndex) => {
                        page.drawText(line, {
                            x: margin + fieldColumnWidth + 10,
                            y: yPosition - (rowHeight / 2) - (textHeight / 2) + (wrappedLines.length - 1 - lineIndex) * (textHeight - 2),
                            size: textHeight,
                            font: helveticaFont,
                            color: accentColor,
                        });
                    });

                    yPosition -= rowHeight;
                });
            }
        } else {
            page.drawRectangle({
                x: margin,
                y: yPosition - 40,
                width: contentWidth,
                height: 40,
                color: rgb(0.98, 0.95, 0.95),
                borderColor: rgb(0.9, 0.7, 0.7),
                borderWidth: 1,
            });
            page.drawText("No additional order details available", {
                x: margin + 20,
                y: yPosition - 25,
                size: 12,
                font: helveticaFont,
                color: rgb(0.7, 0.4, 0.4),
            });
            yPosition -= 60;
        }

        // --- Footer Section ---
        const drawFooter = (currentPage, pageNumber, totalPages) => {
            const footerY = margin + 20;
            currentPage.drawText("Generated by ManageFlow", {
                x: margin + 10,
                y: footerY,
                size: 8,
                font: helveticaBoldFont,
                color: primaryColor,
            });

            currentPage.drawText(`Document ID: ${order.order_number || order.id}`, {
                x: pageWidth / 2 - 50,
                y: footerY,
                size: 8,
                font: helveticaFont,
                color: secondaryColor,
            });

            currentPage.drawText(`Page ${pageNumber} of ${totalPages}`, {
                x: pageWidth - margin - 60,
                y: footerY,
                size: 8,
                font: helveticaFont,
                color: secondaryColor,
            });
        };

        const pages = pdfDoc.getPages();
        pages.forEach((p, i) => drawFooter(p, i + 1, pages.length));

        // Finalize and trigger download
        const pdfBytes = await pdfDoc.save();
        console.log("Enhanced PDF generated, size:", pdfBytes.byteLength);

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `ManageFlow_Order_${order.order_number || order.id}_${new Date().getTime()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.success("📄 PDF downloaded successfully!");

    } catch (error) {
        console.error("Failed to download PDF:", error);
        toast.error(`❌ Failed to download PDF: ${error.message}`);
    }
};

  // Helper function for text wrapping
  const wrapText = (text, maxLength) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };  

  // Place Order button handler (to be called from header)
  const handlePlaceOrder = () => {
    setShowOrderCreator(true);
  };

  // Order selection handlers




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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          {/* Place Order button is now in the header, not here */}
        </div>
        {/* Status Filter Bar Only */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              className="block px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Delivered</option>
            </select>
          </div>
          <div className="text-right text-sm text-gray-500 flex items-center justify-end">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FiPackage className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "You haven't placed any orders yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={`bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 ${
                  newOrderConfirmed === order.id.toString() ? "ring-2 ring-green-500" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleOrderClick(order)}
                          className="text-lg font-semibold text-gray-800 hover:text-indigo-600 hover:underline cursor-pointer transition-colors duration-200 flex items-center"
                        >
                          Order # {order.order_number}
                          <FiInfo className="ml-2 text-gray-400 hover:text-indigo-500 transition-colors" />
                        </button>
                        {newOrderConfirmed === order.id.toString() && (
                          <span className="ml-2 flex items-center text-sm text-green-600">
                            <FaCheck className="mr-1" /> Order placed successfully
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        <FiCalendar className="inline mr-1" />
                        {formatDate(order.created_at)} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status Badge - visually appealing */}
                      {(() => {
                        switch (order.status) {
                          case "pending":
                            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200"><FiClock className="mr-1.5 w-4 h-4" /> Pending</span>;
                          case "in_production":
                            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><FiPackage className="mr-1.5 w-4 h-4" /> In Production</span>;
                          case "shipped":
                            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"><FiTruck className="mr-1.5 w-4 h-4" /> Shipped</span>;
                          case "completed":
                            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200"><FiCheckCircle className="mr-1.5 w-4 h-4" /> Delivered</span>;
                          default:
                            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200"><FiArchive className="mr-1.5 w-4 h-4" /> {order.status}</span>;
                        }
                      })()}

                      {/* Download PDF Button */}
                      <button
                        onClick={() => handleDownloadPDF(order)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Download PDF"
                      >
                        <FiDownload className="w-5 h-5" />
                      </button>

                      {canEditOrder(order.status) && (
                        <>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            title="Edit Order"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Order"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {order.status === "shipped" && (
                        <button
                          onClick={() => {
                            setOrderToConfirm(order);
                            setShowDeliveryModal(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          title="Confirm Delivery"
                        >
                          <FaCheck className="inline mr-2" />
                          Confirm Delivery
                        </button>
                      )}

                    </div>
                  </div>


                </div>
              </div>
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
        {showDeleteModal && orderToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setOrderToDelete(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600">
                  Are you sure you want to delete order # {orderToDelete.order_number || orderToDelete.data?.order_id || orderToDelete.id}?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. All data associated with this order will be permanently deleted.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setOrderToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Confirmation Modal */}
        {showDeliveryModal && orderToConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delivery</h3>
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setOrderToConfirm(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium text-gray-900">Order Delivered</h4>
                    <p className="text-sm text-gray-500">Order #{orderToConfirm.order_number || orderToConfirm.data?.order_id || orderToConfirm.id}</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Please confirm that you have received your order. This will mark the order as delivered and complete the transaction.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setOrderToConfirm(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Order Details Modal */}
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



        {/* No Fields Modal */}
        {showNoFieldsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 flex flex-col items-center">
                <p className="text-lg font-semibold mb-4 text-center">
                  No order fields are configured.<br />
                  Please add fields in <span className="font-bold">Settings</span>.
                </p>
                <button
                  onClick={() => {
                    setShowNoFieldsModal(false);
                    if (setActiveTab) setActiveTab('settings');
                  }}
                  className="px-5 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: colors.primary }}
                >
                  Go to Settings
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default OrderManagement;