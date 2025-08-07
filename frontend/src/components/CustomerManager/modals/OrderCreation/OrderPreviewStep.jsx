import React from 'react';
import { ChevronLeft, Package, Calendar, User, FileText, CheckCircle, DollarSign, ChevronDown } from 'lucide-react';

const OrderPreviewStep = ({ 
  selectedProduct, 
  orderData, 
  orderFormTemplate, 
  onSubmit, 
  onBack,
  loading,
  isEdit = false
}) => {

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
      case 'number':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'date':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'currency':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'text':
        return <FileText className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl text-[#343A40] font-bold mb-2 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-[#343A40]" />
          {isEdit ? 'Review Changes' : 'Order Summary'}
        </h3>
        <p className="text-[#6C757D]">
          {isEdit 
            ? 'Confirm your updates before saving' 
            : 'Verify all details before submission'
          }
        </p>
      </div>

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
            <div className="flex flex-col items-center mb-4">
              <div className="w-48 h-48 bg-[#E9ECEF] rounded-lg overflow-hidden flex items-center justify-center">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="w-12 h-12 text-[#ADB5BD]" />
                )}
              </div>
            </div>

            <h5 className="text-center text-[#343A40] font-medium mb-4">
              {selectedProduct.name}
            </h5>

            {selectedProduct.field_values?.length > 0 && (
              <div className="space-y-2">
                {selectedProduct.field_values.map((fieldValue, index) => (
                  <div key={index} className="flex justify-between p-3 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg">
                    <span className="text-[#6C757D] text-sm">{fieldValue.field.label}:</span>
                    <span className="text-[#343A40] font-medium text-sm">
                      {fieldValue.value || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* Order Details Dropdown */}
        <details className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg">
          <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-[#E9ECEF] transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#343A40]" />
              <span className="font-medium text-[#495057]">Order Information</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#6C757D] transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {[
                { icon: <Package className="w-4 h-4 text-[#343A40]" />, label: 'Quantity', value: orderData.quantity },
                { icon: <Calendar className="w-4 h-4 text-[#343A40]" />, label: 'Order Date', value: orderData.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : 'Not set' },
                { icon: <Calendar className="w-4 h-4 text-[#343A40]" />, label: 'Return Date', value: orderData.returnDate ? new Date(orderData.returnDate).toLocaleDateString() : 'Not set' },
                { icon: <User className="w-4 h-4 text-[#343A40]" />, label: 'Sent By', value: orderData.sentBy || 'Not specified' },
                { icon: <User className="w-4 h-4 text-[#343A40]" />, label: 'Customer', value: orderData.customer || 'N/A' },
                { icon: <FileText className="w-4 h-4 text-[#343A40]" />, label: 'Special Instructions', value: orderData.specialInstructions || 'None' }
              ].map((item, index) => (
                <div key={index} className="flex justify-between p-3 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-[#6C757D] text-sm">{item.label}:</span>
                  </div>
                  <span className="text-[#343A40] font-medium text-sm">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#343A40] text-[#343A40] rounded-lg hover:bg-[#E9ECEF] disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#343A40] text-[#F8F9FA] rounded-lg hover:bg-[#212529] disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#F8F9FA] border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isEdit ? 'Update Order' : 'Confirm Order'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPreviewStep; 