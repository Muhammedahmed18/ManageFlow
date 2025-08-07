import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Calculator, 
  DollarSign, 
  Calendar, 
  User, 
  FileText,
  Save,
  Search,
  Check,
  Package,
  Users,
  ArrowRight,
  AlertCircle,
  Info
} from 'lucide-react';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const InvoiceCreator = ({ businessId, onClose, onCreated, editInvoice = null, selectedOrder = null }) => {
  // Form state
  const [formData, setFormData] = useState({
    // Invoice Metadata
    invoice_date: new Date().toISOString().split('T')[0],
    po_number: '',
    
    // Customer/Bill To
    customer_name: '',
    bill_to: '',
    contact_info: '',
    
    // Line Items
    line_items: [
      { id: 1, quantity: 1, description: '', unit_price: 0, amount: 0, order_reference: '' }
    ],
    
    // Totals
    subtotal: 0,
    sales_tax: 0,
    gross_total: 0,
    advanced_paid: 0,
    balance_due: 0,
    
    // Footer/Notes
    payment_instructions: '',
    contact_for_questions: '',
    thank_you_message: 'Thank you for your business!'
  });

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  // UI state
  const [activeStep, setActiveStep] = useState(1);
  const [lineItems, setLineItems] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [invoiceType, setInvoiceType] = useState('manufacturer_to_customer');
  const [customerName, setCustomerName] = useState('');
  const [billTo, setBillTo] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [salesTax, setSalesTax] = useState(0);
  const [advancedPaid, setAdvancedPaid] = useState(0);
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [contactForQuestions, setContactForQuestions] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    console.log('InvoiceCreator useEffect - editInvoice:', editInvoice, 'selectedOrder:', selectedOrder);
    loadOrders();
    
    if (editInvoice) {
      loadInvoiceForEdit();
      // Start at step 2 (Invoice Details) when editing
      setActiveStep(2);
    } else if (selectedOrder) {
      // Auto-populate form with selected order data
      autoPopulateFromOrder(selectedOrder);
      // Start at step 2 (Invoice Details) when creating from order
      setActiveStep(2);
    }
  }, [businessId, editInvoice, selectedOrder]);

  const autoPopulateFromOrder = (order) => {
    console.log('Auto-populating from order:', order);
    console.log('Order data:', order.data);
    console.log('Order customer:', order.customer);
    
    // Extract customer name from order data - prioritize order form data over username
    const customerName = order.data?.customer || 
                       order.customer_name || 
                       order.customer?.username || 
                       'Unknown Customer';
    
    // Generate line item from order - use correct field names
    const product = order.data?.product || 'Product';
    const quantity = order.data?.quantity || 1;
    
    console.log('Extracted customer name:', customerName);
    console.log('Extracted product:', product);
    console.log('Extracted quantity:', quantity);
    
    const lineItems = [{
      id: 1,
      quantity: quantity,
      description: product,
      unit_price: 0, // Will need to be set by user
      amount: 0, // Will be calculated
      order_reference: order.order_number || `Order ${order.id}`
    }];
    
    console.log('Generated line items:', lineItems);
    
    // Update form data with auto-populated values
    setFormData(prev => ({
      ...prev,
      customer_name: customerName,
      line_items: lineItems
    }));
    
    // Set selected orders for the form
    setSelectedOrders([order]);
    
    // Recalculate totals with new line items
    calculateTotals(lineItems);
  };

  const loadOrders = async () => {
    try {
      const response = await api.get(`/management/manufacturer/orders/?business=${businessId}`);
      const allOrders = response.data.results || response.data || [];
      console.log('InvoiceCreator: Loaded all orders:', allOrders.map(o => ({ 
        order_number: o.order_number, 
        status: o.status,
        customer: o.customer?.username || o.customer_name 
      })));
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    }
  };



  const loadInvoiceForEdit = async () => {
    if (editInvoice) {
      console.log('Loading invoice for edit:', editInvoice);
      
      // Load the related orders for this invoice using existing orders list
      if (editInvoice.related_orders && editInvoice.related_orders.length > 0) {
        try {
          // Get all orders and filter by the related order IDs
          const allOrders = await api.get(`/management/manufacturer/orders/?business=${businessId}`);
          const ordersList = allOrders.data.results || allOrders.data || [];
          
          // Filter orders by the related order IDs
          const relatedOrders = ordersList.filter(order => 
            editInvoice.related_orders.includes(order.id)
          );
          
          console.log('Filtered related orders:', relatedOrders);
          setSelectedOrders(relatedOrders);
        } catch (error) {
          console.error('Error loading related orders:', error);
        }
      }
      
      setFormData({
        invoice_date: editInvoice.invoice_date || new Date().toISOString().split('T')[0],
        po_number: editInvoice.po_number || '',
        customer_name: editInvoice.customer_name || '',
        bill_to: editInvoice.bill_to || '',
        contact_info: editInvoice.contact_info || '',
        line_items: editInvoice.line_items?.length > 0 ? editInvoice.line_items : [
          { id: 1, quantity: 1, description: '', unit_price: 0, amount: 0, order_reference: '' }
        ],
        subtotal: editInvoice.subtotal || 0,
        sales_tax: editInvoice.sales_tax || 0,
        gross_total: editInvoice.gross_total || 0,
        advanced_paid: editInvoice.advanced_paid || 0,
        balance_due: editInvoice.balance_due || 0,
        payment_instructions: editInvoice.payment_instructions || '',
        contact_for_questions: editInvoice.contact_for_questions || '',
        thank_you_message: editInvoice.thank_you_message || 'Thank you for your business!'
      });
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    // Always show 2 decimal places, even for zero
    const formatted = num.toFixed(2);
    return `$${formatted}`;
  };

  // Calculate line item amount with precise decimal handling
  const calculateLineItemAmount = (quantity, unitPrice) => {
    const qty = preciseMoneyCalculation(quantity);
    const price = preciseMoneyCalculation(unitPrice);
    return preciseMoneyCalculation(qty * price);
  };

  // Update line item
  const updateLineItem = (index, field, value) => {
    const updatedItems = [...formData.line_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate amount for this line item
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : updatedItems[index].unit_price;
      updatedItems[index].amount = calculateLineItemAmount(quantity, unitPrice);
    }
    
    setFormData({ ...formData, line_items: updatedItems });
    calculateTotals(updatedItems);
  };

  // Add new line item
  const addLineItem = () => {
    const newId = Math.max(...formData.line_items.map(item => item.id), 0) + 1;
    const newItem = {
      id: newId,
      quantity: 1,
      description: '',
      unit_price: 0,
      amount: 0,
      order_reference: ''
    };
    setFormData({
      ...formData,
      line_items: [...formData.line_items, newItem]
    });
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (formData.line_items.length > 1) {
      const updatedItems = formData.line_items.filter((_, i) => i !== index);
      setFormData({ ...formData, line_items: updatedItems });
      calculateTotals(updatedItems);
    }
  };

  // Calculate all totals with precise decimal handling
  const calculateTotals = (items = formData.line_items) => {
    // Use precise calculations to avoid floating-point errors
    const subtotal = items.reduce((sum, item) => {
      const itemAmount = preciseMoneyCalculation(item.amount || 0);
      return preciseMoneyCalculation(sum + itemAmount);
    }, 0);
    
    const tax = preciseMoneyCalculation(formData.sales_tax || 0);
    const grossTotal = preciseMoneyCalculation(subtotal + tax);
    const advanced = preciseMoneyCalculation(formData.advanced_paid || 0);
    const balanceDue = Math.max(0, preciseMoneyCalculation(grossTotal - advanced));

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      gross_total: grossTotal,
      balance_due: balanceDue
    }));
  };

  // Order selection handlers
  const toggleOrderSelection = (order) => {
    setSelectedOrders(prev => {
      const isSelected = prev.find(o => o.id === order.id);
      if (isSelected) {
        return prev.filter(o => o.id !== order.id);
      } else {
        return [...prev, order];
      }
    });
  };

  const selectAllOrders = () => {
    const availableOrders = orders.filter(order => order.status === 'completed' || order.status === 'shipped' || order.status === 'delivered');
    setSelectedOrders(availableOrders);
  };

  const clearOrderSelection = () => {
    setSelectedOrders([]);
  };

  // Validate customer consistency across selected orders
  const validateCustomerConsistency = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order');
      return false;
    }

    console.log('Selected orders for customer validation:', selectedOrders);

    // Extract customer information from orders - prioritize order form data
    const customers = selectedOrders.map(order => {
      const customerName = order.data?.customer || 
                          order.data?.customer_name ||
                          order.customer_name || 
                          order.customer?.username || 
                          order.customer?.first_name || 
                          order.customer?.last_name;
      
      console.log(`Order ${order.order_number} customer data:`, {
        customer: order.customer,
        customerName: customerName,
        orderData: order.data
      });
      
      return {
        name: customerName,
        id: order.customer?.id
      };
    }).filter(customer => customer.name); // Remove empty customer names

    console.log('Extracted customers:', customers);

    if (customers.length === 0) {
      // No customer data found, allow manual entry
      console.log('No customer data found, allowing manual entry');
      return true;
    }

    // Check if all orders have the same customer
    const uniqueCustomers = [...new Set(customers.map(c => c.name))];
    console.log('Unique customers:', uniqueCustomers);
    
    if (uniqueCustomers.length > 1) {
      toast.error('Cannot create invoice for multiple customers. Please select orders from the same customer.');
      return false;
    }

    // Don't auto-populate customer information here - let generateLineItemsFromOrders handle it
    console.log('Customer consistency validated - customer name will be set in generateLineItemsFromOrders');

    return true;
  };

  const generateLineItemsFromOrders = () => {
    console.log('generateLineItemsFromOrders called with selectedOrders:', selectedOrders);
    console.log('selectedOrders length:', selectedOrders.length);
    
    if (validateCustomerConsistency()) {
      // Auto-populate customer name and line items from selected orders
      const firstOrder = selectedOrders[0];
      if (firstOrder) {
        console.log('First order:', firstOrder);
        console.log('First order data:', firstOrder.data);
        console.log('First order customer:', firstOrder.customer);
        console.log('First order customer_name:', firstOrder.customer_name);
        
        // Extract customer name from order data - prioritize order form data over username
        const customerName = firstOrder.data?.customer || 
                           firstOrder.customer_name || 
                           firstOrder.customer?.username || 
                           'Unknown Customer';
        
        console.log('Extracted customer name:', customerName);
        
        // Generate line items from selected orders - use correct field names
        const lineItems = selectedOrders.map((order, index) => {
          console.log(`Processing order ${index + 1}:`, order);
          console.log(`Order ${index + 1} data:`, order.data);
          
          const product = order.data?.product || 'Product';
          const quantity = order.data?.quantity || 1;
          
          console.log(`Order ${index + 1} - Product: ${product}, Quantity: ${quantity}`);
          
          return {
            id: index + 1,
            quantity: quantity,
            description: product,
            unit_price: 0, // Will need to be set by user
            amount: 0, // Will be calculated
            order_reference: order.order_number || `Order ${order.id}`
          };
        });
        
        console.log('Generated line items:', lineItems);
        
        // Update form data with auto-populated values
        setFormData(prev => {
          const updated = {
            ...prev,
            customer_name: customerName,
            line_items: lineItems
          };
          console.log('Updated form data:', updated);
          return updated;
        });
        
        // Force a re-render to ensure the customer name is displayed
        setTimeout(() => {
          console.log('Form data after timeout:', formData);
        }, 100);
        
        // Recalculate totals with new line items
        calculateTotals(lineItems);
      } else {
        console.log('No first order found in selectedOrders');
      }
      
      setActiveStep(2);
    } else {
      console.log('Customer consistency validation failed');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    if (!formData.bill_to.trim()) {
      toast.error('Bill to address is required');
      return;
    }

    if (formData.line_items.length === 0) {
      toast.error('At least one line item is required');
      return;
    }

    // Check if line items have valid descriptions
    const invalidLineItems = formData.line_items.filter(item => 
      !item.description || item.description.trim() === '' || item.description === 'Item description'
    );
    
    if (invalidLineItems.length > 0) {
      toast.error('All line items must have valid descriptions');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare invoice data
      const invoiceData = {
          ...formData,
          business: businessId,
          amount: formData.gross_total, // Use gross total as main amount
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        related_orders: selectedOrders.map(order => order.id)
      };

      // Use enhanced invoice API
      console.log('🔄 InvoiceCreator: About to create invoice with data:', invoiceData);
      const response = await api.post('/management/enhanced-invoices/', invoiceData);
      console.log('🔄 InvoiceCreator: Invoice creation response:', response);
      console.log('🔄 InvoiceCreator: Invoice data from response:', response.data.invoice);

      toast.success(editInvoice ? 'Invoice updated successfully!' : 'Invoice created successfully!');
      console.log('🔄 InvoiceCreator: Calling onCreated with invoice data...');
      onCreated(response.data.invoice);
      console.log('🔄 InvoiceCreator: onCreated callback completed');
      onClose();
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to save invoice';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    console.log(`handleInputChange - field: ${field}, value: ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Recalculate totals if tax or advanced paid changes
    if (field === 'sales_tax' || field === 'advanced_paid') {
      calculateTotals();
    }
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.data?.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const availableOrders = filteredOrders.filter(order => 
    order.status === 'completed' || order.status === 'shipped' || order.status === 'delivered'
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
              <p className="text-xs text-gray-600">
                {activeStep === 1 ? 'Select orders to invoice' : 'Configure invoice details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${activeStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Select Orders</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${activeStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Invoice Details</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Line Items</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeStep === 1 && (
            <OrderSelectionStep
              orders={availableOrders}
              selectedOrders={selectedOrders}
              onToggleOrder={toggleOrderSelection}
              onSelectAll={selectAllOrders}
              onClearSelection={clearOrderSelection}
              onGenerateInvoice={generateLineItemsFromOrders}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              editInvoice={editInvoice}
            />
          )}

          {activeStep === 2 && (
            <InvoiceDetailsStep
              formData={formData}
              onFormDataChange={setFormData}
              onInputChange={handleInputChange}
              formatCurrency={formatCurrency}
              selectedOrders={selectedOrders}
              onBack={() => editInvoice ? onClose() : setActiveStep(1)}
              onNext={() => setActiveStep(3)}
              editInvoice={editInvoice}
            />
          )}

          {activeStep === 3 && (
            <LineItemsStep
              formData={formData}
              onFormDataChange={setFormData}
              onUpdateLineItem={updateLineItem}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
              onCalculateTotals={calculateTotals}
              formatCurrency={formatCurrency}
              selectedOrders={selectedOrders}
              onBack={() => setActiveStep(2)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              editInvoice={editInvoice}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Order Selection Step Component
const OrderSelectionStep = ({
  orders,
  selectedOrders,
  onToggleOrder,
  onSelectAll,
  onClearSelection,
  onGenerateInvoice,
  searchQuery,
  onSearchChange,
  editInvoice
}) => {
  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {editInvoice ? 'Invoice Orders' : 'Select Orders to Invoice'}
          </h3>
          <p className="text-sm text-gray-600">
            {editInvoice 
              ? 'Orders included in this invoice (read-only)'
              : 'Choose completed, shipped, or delivered orders to include in this invoice'
            }
          </p>
        </div>
        {!editInvoice && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onClearSelection}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search orders by number, customer, or product..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Selected Orders Summary */}
      {selectedOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Total: {formatCurrency(selectedOrders.reduce((sum, order) => {
                const amount = order.data?.amount || order.data?.total || order.amount || 0;
                return sum + (parseFloat(amount) || 0);
              }, 0))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {orders.length === 0 ? (
                        <div className="text-center py-6">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No orders available</h3>
                <p className="text-sm text-gray-500">
                  Only completed, shipped, or delivered orders can be invoiced
                </p>
              </div>
        ) : (
          orders.map((order) => {
            const isSelected = selectedOrders.find(o => o.id === order.id);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 border rounded-lg transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                } ${!editInvoice ? 'cursor-pointer hover:border-gray-300 hover:bg-gray-50' : ''}`}
                onClick={!editInvoice ? () => onToggleOrder(order) : undefined}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Order #{order.order_number}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {order.customer?.username || order.customer_name}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {order.status === 'completed' ? 'Completed' : 'Shipped'}
                      </span>
                    </div>
                    {order.data?.product_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        {order.data.product_name}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
        {!editInvoice ? (
          <>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Generate Invoice button clicked!');
                console.log('Selected orders:', selectedOrders);
                onGenerateInvoice();
              }}
              disabled={selectedOrders.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Next: Invoice Details ({selectedOrders.length})</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

// Invoice Details Step Component
const InvoiceDetailsStep = ({
  formData,
  onFormDataChange,
  onInputChange,
  formatCurrency,
  selectedOrders,
  onBack,
  onNext,
  editInvoice
}) => {
  console.log('InvoiceDetailsStep render - formData:', formData);
  console.log('InvoiceDetailsStep render - customer_name:', formData.customer_name);
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_name?.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }
    
    if (!formData.bill_to?.trim()) {
      newErrors.bill_to = 'Billing address is required';
    }
    
    if (!formData.contact_info?.trim()) {
      newErrors.contact_info = 'Contact information is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next with validation
  const handleNext = () => {
    if (validateForm()) {
      onNext();
    } else {
      toast.error('Please fill in all required fields');
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
          <p className="text-sm text-gray-600">
            Configure invoice information and line items
          </p>
        </div>
        {!editInvoice && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Orders
          </button>
        )}
      </div>

      {/* Order Summary (for edit mode) */}
      {editInvoice && selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Package className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Selected Orders (Read-only)</h4>
          </div>
          <div className="space-y-2">
            {selectedOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-800">#{order.order_number}</span>
                <span className="text-blue-600">
                  {order.customer?.username || order.data?.customer || 'Unknown Customer'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Invoice Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={formData.invoice_date}
            onChange={(e) => onInputChange('invoice_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Number (Optional)
              </label>
              <textarea
                value={formData.po_number}
            onChange={(e) => onInputChange('po_number', e.target.value)}
                placeholder="Enter purchase order number(s)"
                rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => onInputChange('customer_name', e.target.value)}
                  placeholder="Enter customer name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customer_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.customer_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Info *
                </label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => onInputChange('contact_info', e.target.value)}
                  placeholder="Phone / Email"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contact_info ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.contact_info && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_info}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill To Address *
              </label>
              <textarea
                value={formData.bill_to}
                onChange={(e) => onInputChange('bill_to', e.target.value)}
                placeholder="Enter customer billing address"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bill_to ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.bill_to && (
                <p className="mt-1 text-sm text-red-600">{errors.bill_to}</p>
              )}
            </div>
          </div>





          {/* Footer/Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Additional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Instructions
                </label>
                <textarea
                  value={formData.payment_instructions}
              onChange={(e) => onInputChange('payment_instructions', e.target.value)}
                  placeholder="Enter payment instructions"
                  rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact for Questions
                </label>
                <input
                  type="text"
                  value={formData.contact_for_questions}
              onChange={(e) => onInputChange('contact_for_questions', e.target.value)}
                  placeholder="Name, phone, email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thank You Message
              </label>
              <textarea
                value={formData.thank_you_message}
            onChange={(e) => onInputChange('thank_you_message', e.target.value)}
                placeholder="Thank you message"
                rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            {!editInvoice && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back to Orders
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Next: Line Items
            </button>
          </div>
        </div>
  );
};

// Line Items Step Component
const LineItemsStep = ({
  formData,
  onFormDataChange,
  onUpdateLineItem,
  onAddLineItem,
  onRemoveLineItem,
  onCalculateTotals,
  formatCurrency,
  selectedOrders,
  onBack,
  onSubmit,
  isSubmitting,
  editInvoice
}) => {
  // Auto-populate line items from selected orders when entering Step 3 (only if not already populated)
  useEffect(() => {
    console.log('LineItemsStep useEffect triggered');
    console.log('selectedOrders:', selectedOrders);
    console.log('formData.line_items:', formData.line_items);
    
    // Only populate if line items are empty or default
    const hasValidLineItems = formData.line_items.length > 0 && 
                             formData.line_items.some(item => 
                               item.description && 
                               item.description !== '' && 
                               item.description !== 'Item description'
                             );
    
    if (selectedOrders.length > 0 && !hasValidLineItems) {
      console.log('Auto-populating line items from orders (fallback):', selectedOrders);
      
      const newLineItems = selectedOrders.map((order, index) => {
        // Extract quantity from order form data
        const quantity = order.data?.quantity || order.data?.qty || order.data?.order_quantity || 1;
        
        // Extract product name from order form data
        const productName = order.data?.product || order.data?.product_name || order.data?.item_name || order.data?.description || order.product?.name || 'Product';
        
        // Extract unit price/amount from order form data
        const unitPrice = order.data?.amount || order.data?.total || order.data?.unit_price || order.data?.price || order.amount || 0;
        
        // Calculate total amount based on quantity and unit price
        const totalAmount = parseFloat(quantity) * parseFloat(unitPrice);
        
        console.log(`Order ${index + 1} data:`, {
          orderNumber: order.order_number,
          orderData: order.data,
          extractedQuantity: quantity,
          extractedProductName: productName,
          extractedUnitPrice: unitPrice,
          calculatedTotal: totalAmount
        });
        
        return {
          id: `temp-${Date.now()}-${index}`,
          quantity: parseFloat(quantity),
          description: productName,
          unit_price: parseFloat(unitPrice),
          amount: totalAmount,
          order_reference: order.order_number || `Order ${index + 1}`
        };
      });
      
      console.log('Generated line items (fallback):', newLineItems);
      
      onFormDataChange({
        ...formData,
        line_items: newLineItems
      });
    } else {
      console.log('Line items already populated or no orders selected');
    }
  }, [selectedOrders]); // Only depend on selectedOrders to prevent infinite loop

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          <p className="text-sm text-gray-600">
            Configure order items and pricing
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Invoice Details
        </button>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Line Items
              </h3>
              <button
                type="button"
            onClick={onAddLineItem}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {formData.line_items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-12 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                  onChange={(e) => onUpdateLineItem(index, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
              <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                  onChange={(e) => onUpdateLineItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                {item.order_reference && (
                  <p className="text-xs text-gray-500 mt-1">
                    Order: {item.order_reference}
                  </p>
                )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                  onChange={(e) => onUpdateLineItem(index, 'unit_price', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
              <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="px-2 py-1 text-sm bg-white border border-gray-300 rounded text-right font-medium">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex items-end">
                    {formData.line_items.length > 1 && (
                      <button
                        type="button"
                    onClick={() => onRemoveLineItem(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Totals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sales Tax:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sales_tax === 0 ? '' : formData.sales_tax}
                    onChange={(e) => {
                      const value = preciseMoneyCalculation(e.target.value);
                      onFormDataChange({ ...formData, sales_tax: value });
                      onCalculateTotals();
                    }}
                    className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Gross Total:</span>
                  <span>{formatCurrency(formData.gross_total)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Advanced Paid:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.advanced_paid === 0 ? '' : formData.advanced_paid}
                    onChange={(e) => {
                      const value = preciseMoneyCalculation(e.target.value);
                      onFormDataChange({ ...formData, advanced_paid: value });
                      onCalculateTotals();
                    }}
                    className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Balance Due:</span>
                  <span className={formData.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(formData.balance_due)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
          ← Back to Invoice Details
            </button>
            <button
          type="button"
          onClick={onSubmit}
              disabled={isSubmitting}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editInvoice ? 'Update Invoice' : 'Create Invoice'}
                </>
              )}
            </button>
          </div>
    </div>
  );
};

// Helper function for currency formatting
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  // Always show 2 decimal places, even for zero
  return `$${num.toFixed(2)}`;
};

// Utility function for consistent decimal formatting
const formatDecimalInput = (value) => {
  const num = parseFloat(value) || 0;
  return num.toFixed(2);
};

// Utility function to ensure proper decimal parsing with precision handling
const parseDecimalValue = (value) => {
  const num = parseFloat(value) || 0;
  // Use toFixed(2) to avoid floating-point precision issues
  return parseFloat(num.toFixed(2));
};

// Utility function for precise money calculations
const preciseMoneyCalculation = (amount) => {
  // Convert to string, then to fixed decimal to avoid floating-point errors
  const num = parseFloat(amount) || 0;
  return parseFloat(num.toFixed(2));
};

export default InvoiceCreator; 