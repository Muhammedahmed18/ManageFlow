import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Package, Calendar, User, FileText, DollarSign, Hash, ChevronDown, AlertCircle, Search, Check, Plus } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../../../../services/authService';
import toast from 'react-hot-toast';

const OrderFormStep = ({ 
  selectedProduct, 
  orderData, 
  setOrderData, 
  orderFormTemplate, 
  onSubmit, 
  onBack,
  isEdit = false
}) => {
  const [orderId, setOrderId] = useState('');
  const [endCustomers, setEndCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
        setSelectedCustomerIndex(-1);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowCustomerDropdown(false);
        setSelectedCustomerIndex(-1);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCustomerDropdown]);

  // Fetch end customers on component mount
  useEffect(() => {
    fetchEndCustomers();
  }, []);

  const fetchEndCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const businessId = selectedProduct?.business;
      if (!businessId) {
        console.error('No business ID available');
        return;
      }

      const response = await api.get(`/management/end-customers/?business=${businessId}`);
      setEndCustomers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch end customers:', error);
      // Don't show error toast as this is optional functionality
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    // Only fetch Order ID for new orders, not for editing
    if (!isEdit) {
      // Fetch the real Order ID from backend NumberConfig
      const fetchOrderId = async () => {
        try {
          // Get the business ID from the selected product
          const businessId = selectedProduct?.business;
          if (!businessId) {
            console.error('No business ID available');
            return;
          }

          const response = await api.get(`/management/number-configs/?business=${businessId}&config_type=order`);
          const configs = response.data;
          
          if (configs && configs.length > 0) {
            const config = configs[0]; // Get the first order config
            const generatedOrderNumber = config.prefix 
              ? `${config.prefix}-${config.current_number}`
              : config.current_number.toString();
            setOrderId(generatedOrderNumber);
          } else {
            // If no config exists, create one
            const createResponse = await api.post('/management/number-configs/', {
              business: businessId,
              config_type: 'order',
              prefix: 'ORD',
              current_number: 1,
              increment_by: 1
            });
            
            if (createResponse.data) {
              const config = createResponse.data;
              const generatedOrderNumber = config.prefix 
                ? `${config.prefix}-${config.current_number}`
                : config.current_number.toString();
              setOrderId(generatedOrderNumber);
            }
          }
        } catch (error) {
          console.error('Failed to fetch order number config:', error);
          // Fallback to a simple ID if config fetch fails
          setOrderId(`ORD-${Date.now()}`);
        }
      };
      
      if (selectedProduct) {
        fetchOrderId();
      }
    }
  }, [selectedProduct, isEdit]);

  const handleInputChange = (field, value) => {
    setOrderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field, date) => {
    const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
    handleInputChange(field, formattedDate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCustomerSubmit();
    onSubmit(orderData);
  };

  const handleCustomerChange = (value) => {
    setOrderData(prev => ({
      ...prev,
      customer: value
    }));
    setCustomerSearchQuery(value);
    setShowCustomerDropdown(true);
  };

  const handleCustomerSelect = (customerName) => {
    setOrderData(prev => ({
      ...prev,
      customer: customerName
    }));
    setCustomerSearchQuery(customerName);
    setShowCustomerDropdown(false);
    setSelectedCustomerIndex(-1);
  };

  const handleCustomerInputBlur = () => {
    // Don't close immediately - let the click outside handler manage this
  };

  const handleCustomerInputFocus = () => {
    if (endCustomers.length > 0) {
      setShowCustomerDropdown(true);
      setSelectedCustomerIndex(-1);
    }
  };

  const handleCustomerInputClick = () => {
    if (endCustomers.length > 0) {
      setShowCustomerDropdown(true);
      setSelectedCustomerIndex(-1);
    }
  };

  const handleCustomerKeyDown = (e) => {
    if (!showCustomerDropdown) return;

    const totalOptions = filteredCustomers.length + (customerSearchQuery.length > 0 && !filteredCustomers.find(c => c.name.toLowerCase() === customerSearchQuery.toLowerCase()) ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCustomerIndex(prev => 
          prev < totalOptions - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCustomerIndex(prev => 
          prev > 0 ? prev - 1 : totalOptions - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCustomerIndex >= 0 && selectedCustomerIndex < filteredCustomers.length) {
          handleCustomerSelect(filteredCustomers[selectedCustomerIndex].name);
        } else if (selectedCustomerIndex === filteredCustomers.length && customerSearchQuery.length > 0) {
          handleCustomerSelect(customerSearchQuery);
        }
        break;
      case 'Escape':
        setShowCustomerDropdown(false);
        setSelectedCustomerIndex(-1);
        break;
    }
  };

  const handleCustomerSubmit = () => {
    const value = orderData.customer.trim();
    if (!value) return;

    // Check if the entered value exists in end customers
    const existingCustomer = endCustomers.find(customer => 
      customer.name.toLowerCase() === value.toLowerCase()
    );

    if (!existingCustomer && value) {
      // Automatically create new end customer without confirmation dialog
      handleCustomerDialogConfirm(value);
    } else {
      // Direct update if customer exists
      handleInputChange('customer', value);
    }
  };

  const handleCustomerDialogConfirm = async (customerName) => {
    try {
      const businessId = selectedProduct?.business;
      if (!businessId) {
        throw new Error('No business ID available');
      }

      if (!customerName) {
        throw new Error('No customer name provided');
      }

      // Create new end customer
      const response = await api.post(`/management/end-customers/?business=${businessId}`, {
        name: customerName,
        business: businessId,
        contact_person: '',
        email: '',
        phone: '',
        address: ''
      });

      // Add to local state
      setEndCustomers(prev => [...prev, response.data]);
      
      // Set the customer name in order data
      handleInputChange('customer', customerName);
      
      toast.success('New customer added automatically!');
    } catch (error) {
      console.error('Failed to save new customer:', error);
      toast.error('Failed to save new customer. Please try again.');
      // Still set the customer name as string if save fails
      handleInputChange('customer', customerName);
    }
  };



  const formatFieldValue = (fieldValue, fieldType, fieldConfig) => {
    if (!fieldValue) return 'N/A';
    
    // Handle currency fields with proper formatting
    if (fieldType === 'currency') {
      const currencySymbol = fieldConfig?.currency_symbol || '$';
      const decimalPlaces = fieldConfig?.decimal_places || 2;
      
      // Convert to number and format with currency symbol
      const numericValue = parseFloat(fieldValue);
      if (!isNaN(numericValue)) {
        return `${currencySymbol}${numericValue.toFixed(decimalPlaces)}`;
      }
    }
    
    return fieldValue;
  };

  const getFieldIcon = (fieldType) => {
    switch (fieldType) {
      case 'text':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'number':
        return <Hash className="w-4 h-4 text-blue-500" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'currency':
        return <DollarSign className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Filter customers based on search query
  const filteredCustomers = endCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Add null checking after all hooks to prevent errors when selectedProduct is null
  if (!selectedProduct) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Order ID Badge */}
      {!isEdit && orderId && (
        <div className="mb-6 bg-[#E9ECEF] border border-[#DEE2E6] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#343A40] p-2 rounded-lg">
                <Hash className="w-5 h-5 text-[#F8F9FA]" />
              </div>
              <div>
                <h3 className="text-[#495057] font-medium">Order ID</h3>
                <p className="text-[#6C757D] text-sm">Generated automatically</p>
              </div>
            </div>
            <div className="text-[#212529] font-bold text-lg">
              {orderId}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Product Details Dropdown */}
        <details className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg">
          <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-[#E9ECEF] transition-colors">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#343A40]" />
              <span className="font-medium text-[#495057]">Product Details</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6C757D] transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 bg-[#E9ECEF] rounded-lg mb-4 flex items-center justify-center">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-10 h-10 text-[#ADB5BD]" />
                )}
              </div>
              
              <h4 className="text-[#343A40] font-medium text-center mb-4">
                {selectedProduct.name}
              </h4>
              
              {selectedProduct.field_values?.length > 0 && (
                <div className="w-full space-y-2">
                  {selectedProduct.field_values.map((fieldValue, index) => (
                    <div key={index} className="flex justify-between p-3 bg-[#F8F9FA] border border-[#DEE2E6] rounded text-sm">
                      <span className="text-[#6C757D]">{fieldValue.field.label}:</span>
                      <span className="text-[#343A40] font-medium">
                        {fieldValue.value || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>

        {/* Order Details Dropdown */}
        <details className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg">
          <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-[#E9ECEF] transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#343A40]" />
              <span className="font-medium text-[#495057]">{isEdit ? 'Edit Order' : 'Order Details'}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6C757D] transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}
            <div>
              <label className="block text-[#495057] text-sm font-medium mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={orderData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                required
              />
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-[#495057] text-sm font-medium mb-1.5">
                Order Date *
              </label>
              <div className="relative">
                <DatePicker
                  selected={orderData.orderDate ? new Date(orderData.orderDate) : null}
                  onChange={(date) => handleDateChange('orderDate', date)}
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                  dateFormat="MM/dd/yy"
                  placeholderText="mm/dd/yy"
                  required
                  minDate={new Date()}
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-5 h-5 text-[#6C757D]" />
                </div>
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-[#495057] text-sm font-medium mb-1.5">
                Return Date *
              </label>
              <div className="relative">
                <DatePicker
                  selected={orderData.returnDate ? new Date(orderData.returnDate) : null}
                  onChange={(date) => handleDateChange('returnDate', date)}
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                  dateFormat="MM/dd/yy"
                  placeholderText="mm/dd/yy"
                  required
                  minDate={orderData.orderDate ? new Date(orderData.orderDate) : new Date()}
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={15}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-5 h-5 text-[#6C757D]" />
                </div>
              </div>
            </div>

            {/* Sent By */}
            <div>
              <label className="block text-[#495057] text-sm font-medium mb-1.5">
                Sent By *
              </label>
              <input
                type="text"
                value={orderData.sentBy}
                onChange={(e) => handleInputChange('sentBy', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                placeholder="Enter the person who placed the order"
                required
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-[#495057] text-sm font-medium mb-1.5">
                Customer *
              </label>
              {loadingCustomers ? (
                <div className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#343A40] mr-2"></div>
                  <span className="text-[#6C757D] text-sm">Loading customers...</span>
                </div>
              ) : endCustomers.length > 0 ? (
                <div className="relative" ref={dropdownRef}>
                                     <input
                     type="text"
                     value={customerSearchQuery}
                     onChange={(e) => setCustomerSearchQuery(e.target.value)}
                     onBlur={handleCustomerInputBlur}
                     onFocus={handleCustomerInputFocus}
                     onClick={handleCustomerInputClick}
                     onKeyDown={handleCustomerKeyDown}
                     className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                     placeholder="Select from dropdown or type to automatically add new"
                     required
                   />
                                     <div 
                     className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 hover:bg-[#E9ECEF] rounded transition-colors"
                     onClick={handleCustomerInputClick}
                   >
                     <ChevronDown className={`w-4 h-4 text-[#6C757D] transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                   </div>
                                     {showCustomerDropdown && (
                     <div className="absolute z-10 w-full bg-white border border-[#DEE2E6] rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                       <div className="p-2 border-b border-[#E9ECEF]">
                         <div className="relative">
                           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6C757D]" />
                           <input
                             type="text"
                             placeholder="Search customers..."
                             value={customerSearchQuery}
                             onChange={(e) => setCustomerSearchQuery(e.target.value)}
                             className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8F9FA] border border-[#DEE2E6] rounded-md focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                             autoFocus
                           />
                         </div>
                       </div>
                       <div className="max-h-48 overflow-y-auto">
                         {filteredCustomers.length === 0 ? (
                           <div className="p-4 text-center">
                             {customerSearchQuery.length > 0 ? (
                               <div className="text-sm text-[#6C757D]">
                                 <div className="mb-2">No customers found for "{customerSearchQuery}"</div>
                                                                      <div className="text-xs text-[#ADB5BD]">
                                   Press Enter to automatically add new customer
                                 </div>
                               </div>
                             ) : (
                               <div className="text-sm text-[#6C757D]">
                                 <User className="w-8 h-8 mx-auto mb-2 text-[#ADB5BD]" />
                                 <div>No customers available</div>
                                 <div className="text-xs text-[#ADB5BD] mt-1">
                                   Type to automatically add a new customer
                                 </div>
                               </div>
                             )}
                           </div>
                         ) : (
                           <>
                             {filteredCustomers.map((customer, index) => (
                               <div
                                 key={customer.id}
                                 className={`flex items-center justify-between p-3 cursor-pointer transition-colors border-b border-[#F8F9FA] last:border-b-0 ${
                                   index === selectedCustomerIndex 
                                     ? 'bg-[#343A40] text-white' 
                                     : 'hover:bg-[#E9ECEF]'
                                 }`}
                                 onClick={() => handleCustomerSelect(customer.name)}
                               >
                                 <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                     index === selectedCustomerIndex ? 'bg-white' : 'bg-[#343A40]'
                                   }`}>
                                     <User className={`w-4 h-4 ${
                                       index === selectedCustomerIndex ? 'text-[#343A40]' : 'text-white'
                                     }`} />
                                   </div>
                                   <div>
                                     <div className={`font-medium ${
                                       index === selectedCustomerIndex ? 'text-white' : 'text-[#343A40]'
                                     }`}>{customer.name}</div>
                                     {customer.contact_person && (
                                       <div className={`text-xs ${
                                         index === selectedCustomerIndex ? 'text-gray-200' : 'text-[#6C757D]'
                                       }`}>{customer.contact_person}</div>
                                     )}
                                   </div>
                                 </div>
                                 {orderData.customer === customer.name && (
                                   <Check className={`w-4 h-4 ${
                                     index === selectedCustomerIndex ? 'text-white' : 'text-[#343A40]'
                                   }`} />
                                 )}
                               </div>
                             ))}
                             {customerSearchQuery.length > 0 && !filteredCustomers.find(c => c.name.toLowerCase() === customerSearchQuery.toLowerCase()) && (
                               <div className="border-t border-[#E9ECEF]">
                                 <div
                                   className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                     selectedCustomerIndex === filteredCustomers.length 
                                       ? 'bg-[#343A40] text-white' 
                                       : 'hover:bg-[#E9ECEF]'
                                   }`}
                                   onClick={() => handleCustomerSelect(customerSearchQuery)}
                                 >
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                     selectedCustomerIndex === filteredCustomers.length ? 'bg-white' : 'bg-blue-100'
                                   }`}>
                                     <Plus className={`w-4 h-4 ${
                                       selectedCustomerIndex === filteredCustomers.length ? 'text-[#343A40]' : 'text-blue-600'
                                     }`} />
                                   </div>
                                   <div>
                                     <div className={`font-medium ${
                                       selectedCustomerIndex === filteredCustomers.length ? 'text-white' : 'text-[#343A40]'
                                     }`}>Create "{customerSearchQuery}"</div>
                                     <div className={`text-xs ${
                                       selectedCustomerIndex === filteredCustomers.length ? 'text-gray-200' : 'text-[#6C757D]'
                                     }`}>Automatically add as new customer</div>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </>
                         )}
                       </div>
                     </div>
                   )}
                </div>
              ) : (
                <input
                  type="text"
                  value={orderData.customer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
                  placeholder="Enter the organization/company name"
                  required
                />
              )}
              {endCustomers.length > 0 && (
                <p className="text-xs text-[#6C757D] mt-1">
                  Select from existing customers or type a new name to automatically add to your customer list
                </p>
              )}
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-[#495057] text-sm font-medium mb-1.5">
                Special Instructions
              </label>
              <textarea
                value={orderData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors resize-none"
                placeholder="Any special requirements or notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#343A40] text-[#343A40] rounded-lg hover:bg-[#E9ECEF] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-[#343A40] text-[#F8F9FA] rounded-lg hover:bg-[#212529] transition-colors font-medium"
              >
                {isEdit ? 'Review Changes' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </details>


    </div>
    </div>
  );
};

export default OrderFormStep; 