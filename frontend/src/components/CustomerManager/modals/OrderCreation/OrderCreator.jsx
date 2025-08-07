import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingCart, FileText, CheckCircle, Package, Calendar, User } from 'lucide-react';
import ProductSelectionStep from './ProductSelectionStep';
import OrderFormStep from './OrderFormStep';
import OrderPreviewStep from './OrderPreviewStep';
import api from '../../../../services/authService';
import toast from 'react-hot-toast';

const OrderCreator = ({ 
  isOpen, 
  onClose, 
  businessId, 
  isEdit = false, 
  editingOrder = null,
  onOrderCreated,
  onOrderUpdated 
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    orderDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    sentBy: '',
    customer: '',
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);


  // Initialize edit mode data
  useEffect(() => {
    if (isEdit && editingOrder) {
      // Set the order data from the existing order
      setOrderData({
        quantity: editingOrder.data?.quantity || 1,
        orderDate: editingOrder.data?.order_date || new Date().toISOString().split('T')[0],
        returnDate: editingOrder.data?.return_date || '',
        sentBy: editingOrder.data?.sent_by || '',
        customer: editingOrder.data?.customer || '',
        specialInstructions: editingOrder.data?.special_instructions || ''
      });
      
      // For edit mode, always start at step 2 (order form)
      setActiveStep(2);
    } else {
      // Reset for create mode
      setOrderData({
        quantity: 1,
        orderDate: new Date().toISOString().split('T')[0],
        returnDate: '',
        sentBy: '',
        customer: '',
        specialInstructions: ''
      });
      setSelectedProduct(null);
      setActiveStep(1);
    }
  }, [isEdit, editingOrder, isOpen]);

  // Handle product selection for edit mode after products are loaded
  useEffect(() => {
    if (isEdit && editingOrder && products.length > 0 && editingOrder.data?.product) {
      console.log('Looking for product:', editingOrder.data.product);
      console.log('Available products:', products.map(p => p.name));
      
      // Find the product by name
      const product = products.find(p => p.name === editingOrder.data.product);
      if (product) {
        console.log('Found product:', product);
        setSelectedProduct(product);
      } else {
        console.log('Product not found in available products');
        // Create a fallback product object with basic info
        const fallbackProduct = {
          id: null,
          name: editingOrder.data.product,
          image: null,
          field_values: [],
          business: businessId
        };
        setSelectedProduct(fallbackProduct);
      }
    }
  }, [isEdit, editingOrder, products, businessId]);

  // Fetch products and order form template on component mount
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
  
    }
  }, [isOpen, businessId]);

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/management/customer/products/?business=${businessId}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    }
  };

  // Removed order form template fetch - not needed for current implementation

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setActiveStep(2);
  };

  const handleOrderFormSubmit = (formData) => {
    setOrderData(formData);
    setActiveStep(3);
  };

  const handleOrderSubmit = async () => {
    setLoading(true);
    try {
      if (isEdit && editingOrder) {
        // Update existing order
        const orderPayload = {
          template_type: "order",
          data: {
            product: selectedProduct.name,
            quantity: orderData.quantity,
            order_date: orderData.orderDate,
            return_date: orderData.returnDate,
            sent_by: orderData.sentBy,
            customer: orderData.customer,
            special_instructions: orderData.specialInstructions,
            // Add product template fields
            ...selectedProduct.field_values?.reduce((acc, field) => {
              acc[field.field.label.toLowerCase().replace(/\s+/g, '_')] = field.value;
              return acc;
            }, {})
          }
        };

        await api.patch(`/management/customer/orders/${editingOrder.id}/`, orderPayload);
        
        toast.success('Order updated successfully!');
        if (onOrderUpdated) {
          onOrderUpdated();
        }
      } else {
        // Create new order
        const orderPayload = {
          business: businessId,
          product: selectedProduct.id,
          order_type: "order_creator", // Default for OrderCreator
          ...orderData,
          data: {
            product: selectedProduct.name,
            quantity: orderData.quantity,
            order_date: orderData.orderDate,
            return_date: orderData.returnDate,
            sent_by: orderData.sentBy,
            customer: orderData.customer,
            special_instructions: orderData.specialInstructions,
            // Add product template fields
            ...selectedProduct.field_values?.reduce((acc, field) => {
              acc[field.field.label.toLowerCase().replace(/\s+/g, '_')] = field.value;
              return acc;
            }, {})
          }
        };

        const response = await api.post('/management/customer/orders/', orderPayload);
        
        toast.success('Order created successfully!');
        if (onOrderCreated) {
          onOrderCreated();
        }
      }
      
      onClose();
      
      // Reset form
      setSelectedProduct(null);
      setOrderData({
        quantity: 1,
        orderDate: new Date().toISOString().split('T')[0],
        returnDate: '',
        sentBy: '',
        customer: '',
        specialInstructions: ''
      });
      setActiveStep(1);
      
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} order. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setOrderData({
      quantity: 1,
      orderDate: new Date().toISOString().split('T')[0],
      returnDate: '',
      sentBy: '',
      customer: '',
      specialInstructions: ''
    });
    setActiveStep(1);
    onClose();
  };

  if (!isOpen) return null;

  const getStepTitle = () => {
    if (isEdit) {
      switch (activeStep) {
        case 1:
          return 'Select Product';
        case 2:
          return 'Edit Information';
        case 3:
          return 'Review Changes';
        default:
          return '';
      }
    } else {
      switch (activeStep) {
        case 1:
          return 'Select Product';
        case 2:
          return 'Add Information';
        case 3:
          return 'Review Order';
        default:
          return '';
      }
    }
  };

  const getStepDescription = () => {
    if (isEdit) {
      switch (activeStep) {
        case 1:
          return 'Choose a product from the catalog';
        case 2:
          return 'Update your order details';
        case 3:
          return 'Review and save your changes';
        default:
          return '';
      }
    } else {
      switch (activeStep) {
        case 1:
          return 'Choose a product from the catalog';
        case 2:
          return 'Fill in your order details';
        case 3:
          return 'Review and submit your order';
        default:
          return '';
      }
    }
  };

  const getStepIcon = () => {
    switch (activeStep) {
      case 1:
        return <Package className="w-6 h-6 text-blue-500" />;
      case 2:
        return <FileText className="w-6 h-6 text-green-500" />;
      case 3:
        return <CheckCircle className="w-6 h-6 text-purple-500" />;
      default:
        return <ShoppingCart className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#6C757D]/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F8F9FA] rounded-xl shadow-lg w-full max-w-4xl h-[90vh] flex flex-col border border-[#DEE2E6]">
        {/* Header */}
        <div className="bg-[#212529] text-[#F8F9FA] p-6 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              {isEdit ? 'Edit Order' : 'Create New Order'}
            </h2>
            <p className="text-[#ADB5BD] mt-1">Step {activeStep} of 3</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#343A40] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
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
                    {step === 1 && 'Select Product'}
                    {step === 2 && (isEdit ? 'Edit' : 'Details')}
                    {step === 3 && 'Review'}
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
            <ProductSelectionStep
              products={products}
              onProductSelect={handleProductSelect}
            />
          )}
          {activeStep === 2 && (
            <OrderFormStep
              selectedProduct={selectedProduct}
              orderData={orderData}
              setOrderData={setOrderData}
              onSubmit={handleOrderFormSubmit}
              onBack={handleBack}
              isEdit={isEdit}
            />
          )}
          {activeStep === 3 && (
            <OrderPreviewStep
              selectedProduct={selectedProduct}
              orderData={orderData}
              onSubmit={handleOrderSubmit}
              onBack={handleBack}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCreator; 