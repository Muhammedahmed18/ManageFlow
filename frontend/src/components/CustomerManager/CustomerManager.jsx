import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Settings from './Settings';
import Dashboard from './Dashboard';

import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import CategoryExplorer from './CategoryExplorer';
import PaymentManagement from './PaymentManagement';
import ManufacturerManagement from './ManufacturerManagement';
import TemplateManagement from './TemplateManagement';
import ProductModal from './modals/ProductModal';
import TemplateModal from './modals/TemplateModal';

import PreviewModal from './modals/PreviewModal';
import ProductPreviewModal from './modals/ProductPreviewModal';
import api from '../../services/authService';

const CustomerManager = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [productSubTab, setProductSubTab] = useState('products');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  // Add state for categories
  const [categories, setCategories] = useState([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [products, setProducts] = useState([]); // Keep for ProductManagement
  const [previewProduct, setPreviewProduct] = useState(null); // Add this state
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Template management state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const placeOrderRef = useRef(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/management/customer/business/${id}/`);
        setBusiness(response.data);
      } catch (err) {
        setError("Failed to load business data.");
        console.error("Error fetching business data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBusinessData();
    } else {
      setIsLoading(false);
      setError("No business ID provided.");
    }
  }, [id]);

      // Fetch categories and products when business is loaded
    useEffect(() => {
      if (!business?.id) return;
      console.log('CustomerManager: Loading data for business ID:', business.id);
      
      // Fetch categories
      api.get(`/management/product-categories/?business=${business.id}`)
        .then(res => {
          console.log('Categories response:', res.data);
          const categoriesArray = Array.isArray(res.data) ? res.data : [];
          setCategories(categoriesArray);
        })
        .catch(err => {
          console.error('Error fetching categories:', err);
          setCategories([]);
        });
    
      // Fetch templates
      api.get(`/management/product-templates/?business=${business.id}`)
        .then(res => {
          console.log('Templates response:', res.data);
          const templatesArray = Array.isArray(res.data) ? res.data : [];
          setTemplates(templatesArray);
        })
        .catch(err => {
          console.error('Error fetching templates:', err);
          setTemplates([]);
        });
    
    // Fetch products for ProductManagement
    fetchProducts();
  }, [business?.id]);









  // Helper to refresh products for ProductManagement
  const fetchProducts = async () => {
    if (!business?.id) return;
    try {
      console.log('Fetching products for ProductManagement:', business.id);
      const res = await api.get(`/management/products/?business=${business.id}`);
      console.log('Products response:', res.data);
      const productsArray = Array.isArray(res.data) ? res.data : [];
      console.log('Products array length:', productsArray.length);
      setProducts(productsArray);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  // Create product
  const onCreateProduct = async (formData) => {
    setIsSavingProduct(true);
    try {
      await api.post('/management/products/', formData);
      await fetchProducts(); // Refresh products after create
      setShowAddProductModal(false);
      // Optionally reset selectedProduct or other state
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Edit product
  const onEditProduct = (product) => {
    setSelectedProduct(product);
    setShowAddProductModal(true);
  };

  // Delete product
  const onDeleteProduct = async (productId) => {
    setIsSavingProduct(true);
    try {
      await api.delete(`/management/products/${productId}/?business=${business.id}`);
      await fetchProducts(); // Refresh products after delete
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Update product
  const onUpdateProduct = async (formData, productId) => {
    setIsSavingProduct(true);
    try {
      await api.put(`/management/products/${productId}/?business=${business.id}`, formData);
      await fetchProducts(); // Refresh products after update
      setShowAddProductModal(false);
      setSelectedProduct(null);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Helper to refresh categories
  const fetchCategories = async () => {
    if (!business?.id) return;
    try {
      console.log('Fetching categories for business:', business.id);
      const res = await api.get(`/management/product-categories/?business=${business.id}`);
      console.log('Categories response:', res.data);
      const categoriesArray = Array.isArray(res.data) ? res.data : [];
      setCategories(categoriesArray);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  // Create category
  const onCreateCategory = async (categoryData) => {
    setIsSavingProduct(true);
    try {
      await api.post('/management/product-categories/', { ...categoryData, business: business.id });
      await fetchCategories(); // Refresh categories after create
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete category
  const onDeleteCategory = async (category, force = false) => {
    try {
      await api.delete(`/management/product-categories/${category.id}/`);
      await fetchCategories();
      return { success: true };
    } catch (err) {
      // Optionally, check for specific error responses (e.g., category not empty)
      if (err.response && err.response.data) {
        return { success: false, ...err.response.data };
      }
      return { success: false, error: 'Failed to delete category.' };
    }
  };

  // Template management functions
  const fetchTemplates = async () => {
    if (!business?.id) return;
    try {
      const res = await api.get(`/management/product-templates/?business=${business.id}`);
      const templatesArray = Array.isArray(res.data) ? res.data : [];
      setTemplates(templatesArray);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
    }
  };

  const onCreateTemplate = async (templateData) => {
    try {
      const response = await api.post('/management/product-templates/', {
        ...templateData,
        business: business.id
      });
      setTemplates(prev => [...prev, response.data]);
      setShowAddTemplateModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Error creating template:', err);
      throw err;
    }
  };

  const onUpdateTemplate = async (templateData, templateId) => {
    try {
      const response = await api.put(`/management/product-templates/${templateId}/`, templateData);
      setTemplates(prev => prev.map(t => t.id === templateId ? response.data : t));
      setShowAddTemplateModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const onDeleteTemplate = async (templateId) => {
    try {
      await api.delete(`/management/product-templates/${templateId}/`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const onEditTemplate = (template) => {
    setSelectedTemplate(template);
    setShowAddTemplateModal(true);
  };

  const onDuplicateTemplate = async (templateId) => {
    try {
      const response = await api.post(`/management/product-templates/${templateId}/duplicate/`);
      setTemplates(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error duplicating template:', err);
    }
  };

  const onActivateTemplate = async (templateId) => {
    try {
      const response = await api.post(`/management/product-templates/${templateId}/activate/`);
      setTemplates(prev => prev.map(t => t.id === templateId ? response.data : t));
    } catch (err) {
      console.error('Error activating template:', err);
    }
  };

  const onDeactivateTemplate = async (templateId) => {
    try {
      const response = await api.post(`/management/product-templates/${templateId}/deactivate/`);
      setTemplates(prev => prev.map(t => t.id === templateId ? response.data : t));
    } catch (err) {
      console.error('Error deactivating template:', err);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen">{error}</div>;
  }
  
  if (!business) {
    return <div className="flex items-center justify-center h-screen">Business not found.</div>;
  }

  const colors = {
    primary: '#1C2E4A',
    primaryLight: '#3A4D6B',
    secondary: '#52677D',
    accent: '#4F46E5',
    accentLight: '#818CF8',
    background: '#F8F9FA',
    cardBg: '#FFFFFF',
    cardHeaderBg: 'linear-gradient(135deg, #1C2E4A 0%, #3A4D6B 100%)',
    headerBg: 'linear-gradient(135deg, #1C2E4A 0%, #2C3E5A 100%)',
    text: '#1E293B',
    textLight: '#64748B',
    textLighter: '#94A3B8',
    border: '#E2E8F0',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        productSubTab={productSubTab}
        setProductSubTab={setProductSubTab}
        colors={colors}
        business={business}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeTab={activeTab}
          productSubTab={productSubTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          colors={colors}
          businessName={business.name}
          showAddForm={activeTab === 'templates' ? showAddTemplateModal : showAddProductModal}
          setShowAddForm={activeTab === 'templates' ? setShowAddTemplateModal : setShowAddProductModal}
          userType="customer"
          onPlaceOrderClick={placeOrderRef}
        />
        {activeTab === 'dashboard' && <Dashboard colors={colors} businessId={business.id} />}
        {activeTab === 'products' && (
          <ProductManagement 
            colors={colors} 
            businessId={business.id} 
            setShowAddForm={setShowAddProductModal}
            categories={categories}
            products={products} // Pass products to ProductManagement
            handlePreviewItem={setPreviewProduct} // Pass preview handler
            onDelete={onDeleteProduct} // Pass delete handler
            onEdit={onEditProduct} // Pass edit handler
            selectedProduct={selectedProduct}
            onCreateCategory={onCreateCategory} // Pass create category handler
            onDeleteCategory={onDeleteCategory} // Pass delete category handler
            onReloadCategories={fetchCategories} // Pass reload handler
          />
        )}
        {activeTab === 'categories' && (
          <CategoryExplorer 
            colors={colors} 
            businessId={business.id} 
            categories={categories} 
            products={products}
            onAddCategory={onCreateCategory} // Pass create category handler
            onReloadCategories={fetchCategories} // Pass reload handler
            onDeleteCategory={onDeleteCategory} // Pass delete handler
            categoryOnlyMode={true}
            showAddCategoryModal={showAddCategoryModal}
            setShowAddCategoryModal={setShowAddCategoryModal}
          />
        )}
        {activeTab === 'orders' && (
          <OrderManagement
            colors={colors}
            businessId={business.id}
            setActiveTab={setActiveTab}
            onPlaceOrderClick={placeOrderRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {activeTab === 'templates' && (
          <TemplateManagement 
            colors={colors} 
            templates={templates}
            searchQuery={searchQuery}
            onEdit={onEditTemplate}
            onDelete={onDeleteTemplate}
            setShowAddForm={setShowAddTemplateModal}
            setSelectedTemplate={setSelectedTemplate}
            handlePreviewItem={(template) => {
              setPreviewTemplate(template);
            }}
            selectedTemplate={selectedTemplate}
          />
        )}
        {activeTab === 'payments' && <PaymentManagement colors={colors} businessId={business.id} />}
        {activeTab === 'manufacturers' && <ManufacturerManagement colors={colors} businessId={business.id} />}
        {activeTab === 'settings' && <Settings colors={colors} businessId={business.id} />}
      </div>

      {showAddProductModal && (
        <ProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          businessId={business.id}
          setShowAddForm={setShowAddProductModal}
          categories={categories}
          templates={templates}
          isSaving={isSavingProduct}
          setIsSaving={setIsSavingProduct}
          onCreateProduct={onCreateProduct}
          onUpdateProduct={onUpdateProduct}
          selectedProduct={selectedProduct}
          // onSave={...} handle saving logic
        />
      )}

      {previewProduct && (
        <ProductPreviewModal
          previewItem={previewProduct}
          setPreviewItem={setPreviewProduct}
          setShowPreview={() => setPreviewProduct(null)}
          colors={colors}
        />
      )}

      {showAddTemplateModal && (
        <TemplateModal
          businessId={business.id}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          setShowAddForm={setShowAddTemplateModal}
          colors={colors}
          isSaving={isSavingProduct}
          setIsSaving={setIsSavingProduct}
          onCreateTemplate={onCreateTemplate}
          onUpdateTemplate={onUpdateTemplate}
        />
      )}

      {previewTemplate && (
        <PreviewModal
          previewItem={previewTemplate}
          setPreviewItem={setPreviewTemplate}
          setShowPreview={() => setPreviewTemplate(null)}
          colors={colors}
        />
      )}
    </div>
  );
};

export default CustomerManager;