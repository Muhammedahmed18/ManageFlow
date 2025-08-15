import { 
  FiPackage, 
  FiCalendar, 
  FiTruck, 
  FiUser, 
  FiCheckCircle, 
  FiClock, 
  FiArchive,
  FiHash,
  FiFileText,
  FiChevronDown
} from "react-icons/fi";

export const getStatusBadge = (status) => {
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

export const formatDate = (dateString) => {
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

export const getFieldIcon = (fieldType) => {
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

export const formatFieldValue = (value, fieldType, fieldConfig) => {
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

export const getFieldValue = (data, key, label) => {
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

export const getDisplayFields = (order, orderFormFields) => {
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

export const filterOrders = (orders, searchQuery, statusFilter) => {
  return orders.filter(order => {
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
};

export const canEditOrder = (status) => {
  // Only allow editing if the order is in 'pending' status
  return status === 'pending';
};

export const getStatusText = (status) => {
  switch (status) {
    case "pending": return "Pending";
    case "in_production": return "In Production";
    case "shipped": return "Shipped";
    case "completed": return "Delivered";
    default: return status;
  }
};

export const getTimelineEntries = (order) => {
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

export const getFieldGroups = (order, orderFormFields) => {
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

