import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, User, FileText, Package, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { calculateTaxAndTotal, formatCurrency, validateInvoiceData, getInvoicePrefix } from '../../../utils/salesUtils';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const OrderBasedInvoiceCreator = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedOrders = [], 
  businessId, 
  invoiceType = 'manufacturer'
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    invoice_number: '',
    recipient_id: '',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    recipient_address: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_percentage: 0,
    notes: '',
    items: [],
    related_orders: selectedOrders.map(order => order.id)
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedOrders.length > 0) {
      generateInvoiceNumber();
      populateFromOrders();
      setActiveStep(1);
    }
  }, [isOpen, selectedOrders]);

  const generateInvoiceNumber = async () => {
    try {
      const response = await api.get(`/management/invoices/generate_number/?business=${businessId}&invoice_type=${invoiceType}`);
      setFormData(prev => ({
        ...prev,
        invoice_number: response.data.invoice_number
      }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
      const prefix = getInvoicePrefix(invoiceType);
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        invoice_number: `${prefix}-${timestamp}`
      }));
    }
  };

  const populateFromOrders = () => {
    if (selectedOrders.length === 0) return;

    // Get customer info from the first order
    const firstOrder = selectedOrders[0];
    const customer = firstOrder.customer;

    // Extract items from all orders
    const allItems = [];
    let totalAmount = 0;

    selectedOrders.forEach(order => {
      if (order.data && order.data.items) {
        order.data.items.forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const itemTotal = quantity * price;
          
          allItems.push({
            product_id: item.product_id || null,
            product_name: item.product_name || item.name || 'Product',
            description: item.description || '',
            quantity: quantity,
            unit_price: price,
            tax_amount: 0,
            total: itemTotal,
            order_id: order.id,
            order_number: order.order_number
          });
          
          totalAmount += itemTotal;
        });
      }
    });

    // Set due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    setFormData(prev => ({
      ...prev,
      recipient_id: customer?.id || '',
      recipient_name: customer?.username || customer?.first_name + ' ' + customer?.last_name || 'Customer',
      recipient_email: customer?.email || '',
      recipient_phone: customer?.phone || '',
      recipient_address: customer?.address || '',
      due_date: dueDate.toISOString().split('T')[0],
      items: allItems,
      related_orders: selectedOrders.map(order => order.id),
      customer_name: customer?.username || customer?.first_name + ' ' + customer?.last_name || 'Customer'
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };

      // Recalculate item totals
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unit_price) || 0;
      const taxPercent = parseFloat(prev.tax_percentage) || 0;
      
      const itemSubtotal = quantity * unitPrice;
      const itemTaxAmount = itemSubtotal * taxPercent / 100;
      const itemTotal = itemSubtotal + itemTaxAmount;

      newItems[index].tax_amount = itemTaxAmount.toFixed(2);
      newItems[index].total = itemTotal.toFixed(2);

      return {
        ...prev,
        items: newItems
      };
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 2:
        // Validate customer information
        if (!formData.recipient_name.trim()) {
          newErrors.recipient_name = 'Recipient name is required';
        }
        if (!formData.invoice_date) {
          newErrors.invoice_date = 'Invoice date is required';
        }
        if (!formData.due_date) {
          newErrors.due_date = 'Due date is required';
        }
        break;
      case 3:
        // Validate line items
        if (formData.items.length === 0) {
          newErrors.items = 'At least one item is required';
        }
        formData.items.forEach((item, index) => {
          if (!item.product_name.trim()) {
            newErrors[`item_${index}_name`] = 'Product name is required';
          }
          if (parseFloat(item.quantity) <= 0) {
            newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
          }
          if (parseFloat(item.unit_price) < 0) {
            newErrors[`item_${index}_price`] = 'Unit price cannot be negative';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
    } else {
      toast.error('Please fix the errors before proceeding');
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        ...formData,
        business: businessId,
        invoice_type: invoiceType,
        subtotal: formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0),
        tax_amount: formData.items.reduce((sum, item) => sum + parseFloat(item.tax_amount), 0),
        total_amount: formData.items.reduce((sum, item) => sum + parseFloat(item.total), 0),
        amount: formData.items.reduce((sum, item) => sum + parseFloat(item.total), 0)
      };

      const validationResult = validateInvoiceData(invoiceData);
      if (!validationResult.isValid) {
        toast.error(validationResult.errors.join(', '));
        return;
      }

      await onSave(invoiceData);
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      invoice_number: '',
      recipient_id: '',
      recipient_name: '',
      recipient_email: '',
      recipient_phone: '',
      recipient_address: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tax_percentage: 0,
      notes: '',
      items: [],
      related_orders: []
    });
    setErrors({});
    setActiveStep(1);
    onClose();
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
    const { taxAmount, total } = calculateTaxAndTotal(subtotal, parseFloat(formData.tax_percentage) || 0);
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStepTitle = () => {
    switch (activeStep) {
      case 1:
        return 'Order Summary';
      case 2:
        return 'Customer Information';
      case 3:
        return 'Line Items';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (activeStep) {
      case 1:
        return 'Review selected orders and invoice details';
      case 2:
        return 'Enter customer and invoice information';
      case 3:
        return 'Review and edit line items';
      default:
        return '';
    }
  };

  const getStepIcon = () => {
    switch (activeStep) {
      case 1:
        return <Package className="w-6 h-6 text-blue-500" />;
      case 2:
        return <User className="w-6 h-6 text-green-500" />;
      case 3:
        return <FileText className="w-6 h-6 text-purple-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
              <p className="text-sm text-gray-600 mt-1">{getStepDescription()}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-[#F8F9FA] border-b border-[#DEE2E6]">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step <= activeStep
                        ? 'bg-[#343A40] text-[#F8F9FA] shadow-sm'
                        : 'bg-[#E9ECEF] text-[#6C757D]'
                    }`}
                  >
                    {step}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step === activeStep ? 'text-[#343A40]' : 'text-[#6C757D]'
                  }`}>
                    {step === 1 && 'Orders'}
                    {step === 2 && 'Customer'}
                    {step === 3 && 'Items'}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={`absolute top-5 left-20 w-16 h-[2px] mx-3 transition-all ${
                      step < activeStep ? 'bg-[#343A40]' : 'bg-[#E9ECEF]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeStep === 1 && (
            <div className="p-6 space-y-6">
              {/* Selected Orders Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center mb-3">
                  <Package className="w-5 h-5 mr-2" />
                  Selected Orders ({selectedOrders.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded border border-blue-200 p-3">
                      <div className="font-medium text-sm">Order #{order.order_number}</div>
                      <div className="text-xs text-gray-600">{formatDate(order.created_at)}</div>
                      <div className="text-xs text-gray-600">{order.customer?.username}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Header Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <div className="text-sm text-gray-900">{formData.invoice_number}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                    <div className="text-sm text-gray-900">{formatDate(formData.invoice_date)}</div>
                  </div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Items Summary</h3>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <div className="font-medium text-sm">{item.product_name}</div>
                        <div className="text-xs text-gray-600">Qty: {item.quantity} × ${item.unit_price}</div>
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(item.total)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.invoice_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.invoice_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.invoice_date}</p>
                  )}
                </div>
              </div>

              {/* Recipient Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <User className="w-5 h-5 mr-2" />
                  Recipient Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="recipient_name"
                      value={formData.recipient_name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.recipient_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Recipient name"
                    />
                    {errors.recipient_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.recipient_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="recipient_email"
                      value={formData.recipient_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="recipient_phone"
                      value={formData.recipient_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.due_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.due_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="recipient_address"
                    value={formData.recipient_address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Recipient address"
                  />
                </div>
              </div>

              {/* Tax Settings */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Calculator className="w-5 h-5 mr-2" />
                  Tax Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="tax_percentage"
                      value={formData.tax_percentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="p-6 space-y-6">
              {/* Invoice Items */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Invoice Items
                  </h3>
                </div>

                {errors.items && (
                  <p className="text-red-500 text-sm mb-4">{errors.items}</p>
                )}

                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items found in selected orders
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Name *
                            </label>
                            <input
                              type="text"
                              value={item.product_name}
                              onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`item_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Product name"
                            />
                            {errors[`item_${index}_name`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_name`]}</p>
                            )}
                            {item.order_number && (
                              <p className="text-xs text-gray-500 mt-1">From Order #{item.order_number}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              min="1"
                              step="1"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="1"
                            />
                            {errors[`item_${index}_quantity`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_quantity`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit Price *
                            </label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                              min="0"
                              step="0.01"
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`item_${index}_price`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0.00"
                            />
                            {errors[`item_${index}_price`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_price`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="w-full px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({formData.tax_percentage}%):</span>
                      <span className="font-medium">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or terms..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-6 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStep === 1}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Invoice
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBasedInvoiceCreator;
