import React, { useEffect, useState } from 'react';
import api from '../../../services/authService';
import { ClipLoader } from 'react-spinners';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
  FiCalendar, 
  FiPackage, 
  FiUser, 
  FiFileText, 
  FiInfo,
  FiClock,
  FiCheckCircle,
  FiHash,
  FiChevronDown
} from 'react-icons/fi';

const DynamicOrderForm = ({ templateId, onSubmit, initialData = {}, isEdit = false }) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderNumberConfig, setOrderNumberConfig] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState({});
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    if (!templateId) return;
    const fetchFields = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await api.get(`/template-upload/${templateId}/positions/`);
        const fetchedFields = response.data || [];
        
        // Add type information to fields
        const fieldsWithTypes = fetchedFields.map(field => ({
          ...field,
          type: determineFieldType(field.key, field.label)
        }));
        
        setFields(fieldsWithTypes);

        const initialForm = {};
        fieldsWithTypes.forEach(field => {
          initialForm[field.key] = isEdit ? (initialData[field.key] || '') : '';
        });
        setFormData(initialForm);
      } catch (err) {
        console.error("Failed to load template fields", err);
        setError("Failed to load form fields. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [templateId, initialData, isEdit]);

  // Fetch order number configuration
  useEffect(() => {
    const fetchOrderNumberConfig = async () => {
      try {
        const response = await api.get('/customer/order-number-config/');
        setOrderNumberConfig(response.data);
      } catch (err) {
        console.error('Failed to fetch order number config:', err);
      }
    };

    fetchOrderNumberConfig();
  }, []);

  // Fetch previous orders for autocomplete
  useEffect(() => {
    const fetchPreviousOrders = async () => {
      try {
        const response = await api.get('/customer/orders/');
        if (response.data && Array.isArray(response.data)) {
          setPreviousOrders(response.data);
          console.log('Previous orders loaded:', response.data); // Debug log
        }
      } catch (err) {
        console.error('Failed to fetch previous orders:', err);
      }
    };

    fetchPreviousOrders();
  }, []);

  const determineFieldType = (key, label) => {
    const keyLower = key.toLowerCase();
    const labelLower = label.toLowerCase();

    if (keyLower.includes('date') || labelLower.includes('date')) {
      return 'date';
    }
    if (keyLower.includes('product') || labelLower.includes('product')) {
      return 'product';
    }
    if (keyLower.includes('notes') || labelLower.includes('notes') || 
        keyLower.includes('description') || labelLower.includes('description')) {
      return 'textarea';
    }
    if (keyLower.includes('order_id') || labelLower.includes('order id')) {
      return 'order_id';
    }
    return 'text';
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/customer/products/");
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (isEdit && initialData && initialData.product && products.length > 0) {
      const matched = products.find(p => p.name === initialData.product);
      setSelectedProduct(matched || null);
    }
  }, [products, initialData, isEdit]);

  useEffect(() => {
    if (!isEdit && selectedProduct && Array.isArray(selectedProduct.field_values) && fields.length > 0) {
      const updates = {};
      fields.forEach(field => {
        const formLabel = field.label.toLowerCase().trim();
        selectedProduct.field_values.forEach(item => {
          const productLabel = item.field?.label?.toLowerCase().trim();
          const key = field.key;
          if (!formData[key] || formData[key] === '') {
            if (formLabel === productLabel) {
              updates[key] = item.value;
            }
          }
        });
      });
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [selectedProduct, fields, isEdit]);

  // Get unique values for a specific field from previous orders
  const getFieldSuggestions = (fieldKey) => {
    if (!previousOrders || !Array.isArray(previousOrders)) {
      console.log('No previous orders available'); // Debug log
      return [];
    }
    
    const suggestions = new Set();
    previousOrders.forEach(order => {
      if (order.data && order.data[fieldKey]) {
        const value = order.data[fieldKey];
        if (value && typeof value === 'string' && value.trim()) {
          suggestions.add(value.trim());
        }
      }
    });
    const result = Array.from(suggestions).sort();
    console.log(`Suggestions for ${fieldKey}:`, result); // Debug log
    return result;
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (key === "product" || key.toLowerCase().includes("product")) {
      const matched = products.find(p => p.name === value);
      setSelectedProduct(matched || null);
    }
  };

  const handleDateChange = (key, date) => {
    const formattedDate = date ? date.toISOString().split('T')[0] : '';
    handleChange(key, formattedDate);
  };

  const handleInputChange = (key, value) => {
    console.log('Input changed:', key, value); // Debug log
    setFormData(prev => ({ ...prev, [key]: value }));
    setShowSuggestions(prev => ({ ...prev, [key]: true }));
    setActiveField(key);
  };

  const handleSuggestionClick = (key, value) => {
    console.log('Suggestion clicked:', key, value); // Debug log
    setFormData(prev => ({ ...prev, [key]: value }));
    setShowSuggestions(prev => ({ ...prev, [key]: false }));
  };

  const handleFieldFocus = (key) => {
    console.log('Field focused:', key); // Debug log
    const suggestions = getFieldSuggestions(key);
    console.log('Suggestions on focus:', suggestions); // Debug log
    if (suggestions.length > 0) {
      setShowSuggestions(prev => ({ ...prev, [key]: true }));
    }
  };

  const handleFieldBlur = (key) => {
    console.log('Field blurred:', key); // Debug log
    setTimeout(() => {
      setShowSuggestions(prev => ({ ...prev, [key]: false }));
    }, 200);
  };

  const getFieldIcon = (field) => {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();

    if (key.includes('date') || label.includes('date')) {
      return <FiCalendar className="w-5 h-5 text-blue-500" />;
    }
    if (key.includes('product') || label.includes('product')) {
      return <FiPackage className="w-5 h-5 text-indigo-500" />;
    }
    if (key.includes('customer') || label.includes('customer')) {
      return <FiUser className="w-5 h-5 text-green-500" />;
    }
    if (key.includes('notes') || label.includes('notes') || 
        key.includes('description') || label.includes('description')) {
      return <FiFileText className="w-5 h-5 text-purple-500" />;
    }
    if (key.includes('order_id') || label.includes('order id')) {
      return <FiHash className="w-5 h-5 text-orange-500" />;
    }
    return <FiInfo className="w-5 h-5 text-gray-500" />;
  };

  const renderFieldInput = (field) => {
    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
    const selectClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white";
    const textareaClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

    switch (field.type) {
      case 'order_id':
        const formattedOrderNumber = orderNumberConfig ? 
          `${orderNumberConfig.prefix ? orderNumberConfig.prefix + '-' : ''}${orderNumberConfig.current_number}` : '';
        return (
          <div className="relative">
            <input
              type="text"
              name={field.key}
              value={formattedOrderNumber}
              readOnly
              className={`${inputClasses} bg-gray-50`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <FiHash className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );

      case 'date':
        const currentDate = formData[field.key] ? new Date(formData[field.key]) : null;
        return (
          <div className="relative">
            <DatePicker
              selected={currentDate}
              onChange={(date) => handleDateChange(field.key, date)}
              className={inputClasses}
              dateFormat="yyyy-MM-dd"
              placeholderText={`Select ${field.label.toLowerCase()}`}
              required={field.required}
              minDate={new Date()}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <FiCalendar className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );

      case 'product':
        return (
          <div className="relative">
            <select
              name={field.key}
              autoComplete="on"
              value={formData[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
              className={selectClasses}
            >
              <option value="">-- Select Product --</option>
              {products.map(product => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <FiPackage className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            name={field.key}
            autoComplete="on"
            value={formData[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={textareaClasses}
            rows={3}
            required={field.required}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          />
        );

      default:
        const suggestions = getFieldSuggestions(field.key);
        const filteredSuggestions = formData[field.key] 
          ? suggestions.filter(s => s.toLowerCase().includes(formData[field.key].toLowerCase()))
          : suggestions;

        console.log(`Rendering field ${field.key}:`, { // Debug log
          suggestions,
          filteredSuggestions,
          showSuggestions: showSuggestions[field.key],
          formData: formData[field.key]
        });

        return (
          <div className="relative">
            <input
              type="text"
              name={field.key}
              autoComplete="off"
              value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              onFocus={() => handleFieldFocus(field.key)}
              onBlur={() => handleFieldBlur(field.key)}
              className={inputClasses}
              required={field.required}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            />
            {showSuggestions[field.key] && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={() => handleSuggestionClick(field.key, suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onSubmit) await onSubmit(formData);
    } catch (err) {
      console.error("Submission error", err);
      setError("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
        <ClipLoader size={35} color="#3B82F6" />
        <p className="mt-4 text-gray-600">Loading form configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <p className="text-gray-600">No fields defined for this template.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          {isEdit ? (
            <>
              <FiClock className="w-6 h-6 text-blue-500" />
              Edit Order
            </>
          ) : (
            <>
              <FiCheckCircle className="w-6 h-6 text-green-500" />
              New Order
            </>
          )}
        </h2>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Update your order details below.' : 'Fill in the details below to place your order.'}
        </p>
      </div>

      <form autoComplete="on" onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {getFieldIcon(field)}
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderFieldInput(field)}
              {field.description && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <FiInfo className="w-4 h-4" />
                  {field.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-lg flex items-center gap-2">
            <FiInfo className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <ClipLoader size={20} color="#ffffff" />
                Processing...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5" />
                {isEdit ? 'Update Order' : 'Submit Order'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicOrderForm;
