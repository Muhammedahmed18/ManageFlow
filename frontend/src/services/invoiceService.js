import api from './authService';

/**
 * Invoice Service
 * Handles all API calls related to invoice management and form builder
 */

// Get invoice form template and configuration
export const getInvoiceFormConfig = async (businessId) => {
  try {
    const response = await api.get(`/management/invoice-form-builder/${businessId ? `${businessId}/` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice form config:', error);
    throw error;
  }
};

// Create new enhanced invoice
export const createEnhancedInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/management/enhanced-invoices/', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error creating enhanced invoice:', error);
    throw error;
  }
};

// Update existing enhanced invoice
export const updateEnhancedInvoice = async (invoiceId, invoiceData) => {
  try {
    const response = await api.put(`/management/enhanced-invoices/${invoiceId}/`, invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error updating enhanced invoice:', error);
    throw error;
  }
};

// Create new invoice (legacy)
export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/management/invoice-form-builder/', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// Update existing invoice (legacy)
export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    const response = await api.put(`/management/invoice-form-builder/update/${invoiceId}/`, invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Get all invoices for a business
export const getInvoices = async (businessId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (businessId) params.append('business', businessId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.invoice_type) params.append('invoice_type', filters.invoice_type);
    
    const response = await api.get(`/management/invoices/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Get single invoice by ID
export const getInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`/management/invoices/${invoiceId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

// Delete invoice
export const deleteInvoice = async (invoiceId) => {
  try {
    const response = await api.delete(`/management/invoices/${invoiceId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// Update invoice status
export const updateInvoiceStatus = async (invoiceId, status) => {
  try {
    const response = await api.patch(`/management/invoices/${invoiceId}/`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

// Download invoice PDF
export const downloadInvoicePDF = async (invoiceId) => {
  try {
    console.log('🔄 invoiceService: Downloading invoice PDF for ID:', invoiceId);
    const response = await api.get(`/management/invoices/${invoiceId}/download/`, {
      responseType: 'blob'
    });
    console.log('🔄 invoiceService: Download response received');
    return response.data;
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
};

// Get orders for invoice creation
export const getOrdersForInvoice = async (businessId) => {
  try {
    const response = await api.get(`/management/manufacturer/orders/?business=${businessId}`);
    return response.data.results || response.data || [];
  } catch (error) {
    console.error('Error fetching orders for invoice:', error);
    throw error;
  }
};

// Currency Configuration
export const getCurrencyConfig = async (businessId) => {
  try {
    const response = await api.get(`/management/currency-configs/?business=${businessId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching currency config:', error);
    throw error;
  }
};

export const createCurrencyConfig = async (configData) => {
  try {
    const response = await api.post('/management/currency-configs/', configData);
    return response.data;
  } catch (error) {
    console.error('Error creating currency config:', error);
    throw error;
  }
};

export const updateCurrencyConfig = async (configId, configData) => {
  try {
    const response = await api.put(`/management/currency-configs/${configId}/`, configData);
    return response.data;
  } catch (error) {
    console.error('Error updating currency config:', error);
    throw error;
  }
};

// Number Configuration
export const getNumberConfig = async (businessId, configType) => {
  try {
    const params = new URLSearchParams();
    if (businessId) params.append('business', businessId);
    if (configType) params.append('config_type', configType);
    
    const response = await api.get(`/management/number-configs/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching number config:', error);
    throw error;
  }
};

export const createNumberConfig = async (configData) => {
  try {
    const response = await api.post('/management/number-configs/', configData);
    return response.data;
  } catch (error) {
    console.error('Error creating number config:', error);
    throw error;
  }
};

export const updateNumberConfig = async (configId, configData) => {
  try {
    const response = await api.put(`/management/number-configs/${configId}/`, configData);
    return response.data;
  } catch (error) {
    console.error('Error updating number config:', error);
    throw error;
  }
};

// Utility functions
export const formatCurrency = (amount, currencyConfig) => {
  if (!amount || !currencyConfig) return '$0.00';
  
  const num = parseFloat(amount) || 0;
  const formatted = num.toFixed(currencyConfig.decimal_places || 2);
  
  return currencyConfig.position === 'before' 
    ? `${currencyConfig.symbol || '$'}${formatted}`
    : `${formatted}${currencyConfig.symbol || '$'}`;
};

export const calculateLineItemAmount = (quantity, unitPrice) => {
  return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
};

export const calculateInvoiceTotals = (lineItems, salesTax = 0, advancedPaid = 0) => {
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const tax = parseFloat(salesTax) || 0;
  const grossTotal = subtotal + tax;
  const advanced = parseFloat(advancedPaid) || 0;
  const balanceDue = grossTotal - advanced;

  return {
    subtotal,
    grossTotal,
    balanceDue
  };
};

// Enhanced invoice data preparation
export const prepareInvoiceData = (formData, selectedOrders = []) => {
  return {
    ...formData,
    related_orders: selectedOrders.map(order => order.id),
    amount: formData.gross_total || formData.amount,
    due_date: formData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
}; 