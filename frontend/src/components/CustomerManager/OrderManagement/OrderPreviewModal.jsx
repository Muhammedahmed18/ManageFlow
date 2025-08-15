import React, { useEffect, useState } from "react";
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
import api from '../../../services/authService';

// Order Preview Modal Component
const OrderPreviewModal = ({ 
  order, 
  orderFormFields, 
  onClose, 
  onEdit, 
  onDelete, 
  onDownload, 
  onConfirmDelivery, 
  canEditOrder, 
  formatDate, 
  formatFieldValue, 
  getFieldIcon, 
  getStatusBadge, 
  orderType 
}) => {
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

export default OrderPreviewModal;
