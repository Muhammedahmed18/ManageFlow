// Enhanced utility functions for Phase 3

export const calculateTaxAndTotal = (subtotal, taxPercentage) => {
  const taxAmount = (subtotal * taxPercentage) / 100;
  const total = subtotal + taxAmount;
  return {
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  const numAmount = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const numValue = parseFloat(value);
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue / 100);
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return '✅';
    case 'pending':
      return '⏳';
    case 'overdue':
      return '⚠️';
    case 'draft':
      return '📝';
    default:
      return '📄';
  }
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const calculateProfitMargin = (revenue, costs) => {
  if (!revenue || revenue <= 0) return 0;
  const profit = revenue - costs;
  return (profit / revenue) * 100;
};

export const calculatePaymentRate = (paidInvoices, totalInvoices) => {
  if (!totalInvoices || totalInvoices <= 0) return 0;
  return (paidInvoices / totalInvoices) * 100;
};

export const getInvoicePrefix = (invoiceType) => {
  switch (invoiceType) {
    case 'customer':
      return 'CUST';
    case 'manufacturer':
      return 'MFG';
    default:
      return 'INV';
  }
};

export const validateInvoiceData = (invoiceData) => {
  const errors = [];

  if (!invoiceData.recipient_name?.trim()) {
    errors.push('Recipient name is required');
  }

  if (!invoiceData.invoice_date) {
    errors.push('Invoice date is required');
  }

  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    invoiceData.items.forEach((item, index) => {
      if (!item.product_name?.trim()) {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
      if (parseFloat(item.quantity) <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (parseFloat(item.unit_price) < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateInvoiceTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
  }, 0);
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    itemCount: items.length
  };
};

export const generateInvoiceNumber = (prefix, sequence) => {
  const timestamp = Date.now().toString().slice(-6);
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${prefix}-${paddedSequence}-${timestamp}`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

export const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    let aVal = a[key];
    let bVal = b[key];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};
