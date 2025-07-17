import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Settings from './Settings';
import Dashboard from './Dashboard';
import TemplateManagement from './TemplateManagement';
import TemplateModal from './modals/TemplateModal';
import ProductManagement from './ProductManagement';
import ProductModal from './modals/ProductModal';
import ProductPreviewModal from './modals/ProductPreviewModal';
import PreviewModal from './modals/PreviewModal';
import AddChoiceModal from './modals/AddChoiceModal';
import CategoryModal from './modals/CategoryModal';
import OrderFormBuilder from "./modals/OrderFormBuilder";
import OrderManagement from './OrderManagement';
import api from '../../services/authService';
import CustomerManagement from './CustomerManagement';
import { FileText, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const BusinessManager = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [productSubTab, setProductSubTab] = useState("products");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [productMenuExpanded, setProductMenuExpanded] = useState(true);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingCustomers, setPendingCustomers] = useState([]);

  const colors = {
    primary: "#1C2E4A",
    secondary: "#52677D",
    accent: "#0F1A2B",
    background: "#0F1A2B",
    backgroundAlt: "#1C2E4A",
    textDark: "#1A202C",
    textMedium: "#4A5568",
    error: "#E53E3E",
    warning: "#F59E0B",
    success: "#38A169",
    border: "#52677D",
    hover: "#2D3748"
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/management/product-categories/?business=${businessId}`);
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchBusiness = async () => {
    try {
      const response = await api.get(`/management/manufacturer/businesses/`);
      const business = response.data.results.find(b => b.id === parseInt(businessId, 10));
      setBusiness(business || null);
    } catch (err) {
      console.error("Error fetching business:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [templatesRes, productsRes] = await Promise.all([
        api.get(`/management/product-templates/?business=${businessId}`),
        api.get(`/management/products/?business=${businessId}`),
      ]);
      
      const processedTemplates = templatesRes.data.map(template => ({
        id: template.id,
        name: template.name,
        fields: template.fields || [],
        created_at: template.created_at || template.uploaded_at || new Date().toISOString(),
        status: template.status || 'draft',
        business: template.business || businessId
      }));

      setTemplates(processedTemplates);
      setProducts(productsRes.data);
      await fetchCategories();
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/management/manufacturer/orders/?business=${businessId}`);
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchBusiness();
      fetchData();
      fetchOrders();
    }
  }, [businessId]);

  const handleDeleteCategory = async (category, force = false) => {
    try {
      const url = `/management/product-categories/${category.id}/${force ? '?force=true' : ''}`;
      const response = await api.delete(url);
      
      if (response.status === 200) {
        setCategories(prev => prev.filter(c => c.id !== category.id));
        if (force) {
          setProducts(prev => prev.filter(p => p.category?.id !== category.id));
        }
        return { success: true, message: response.data.detail };
      }
      throw new Error('Unexpected response from server');
    } catch (err) {
      if (err.response) {
        return {
          success: false,
          error: err.response.data.detail || 'Failed to delete category',
          requiresForce: err.response.data.requires_force || false,
          productsCount: err.response.data.products_count || 0,
          subcategoriesCount: err.response.data.subcategories_count || 0
        };
      }
      return { success: false, error: 'Network error while deleting category' };
    }
  };

  const onCreateCategory = async (categoryData) => {
    setIsSaving(true);
    try {
      const { business, ...payload } = categoryData;
      const response = await api.post('/management/product-categories/', payload);
      setCategories([...categories, response.data]);
      setShowCategoryModal(false);
      return response.data;
    } catch (err) {
      console.error("Error creating category:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const onUpdateCategory = async (categoryData) => {
    setIsSaving(true);
    try {
      const response = await api.put(`/management/product-categories/${categoryData.id}/`, categoryData);
      setCategories(categories.map(c => c.id === response.data.id ? response.data : c));
      setShowCategoryModal(false);
      return response.data;
    } catch (err) {
      console.error("Error updating category:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        businessName={business?.name || "Loading..."}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        productMenuExpanded={productMenuExpanded}
        setProductMenuExpanded={setProductMenuExpanded}
        productSubTab={productSubTab}
        setProductSubTab={setProductSubTab}
        colors={colors}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeTab={activeTab}
          productSubTab={productSubTab}
          businessName={business?.name || "Loading..."}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setShowAddForm={() => {
            if (activeTab === 'products' && productSubTab === 'templates') {
              setSelectedTemplate(null);
              setShowAddForm(true);
            } else if (activeTab === 'products') {
              setSelectedProduct(null);
              setShowAddChoiceModal(true);
            }
          }}
          products={products}
          templates={templates}
          orders={orders}
          customers={customers}
          colors={colors}
        />

        {activeTab === "dashboard" && (
          <Dashboard 
            businessName={business?.name} 
            products={products}
            customers={customers} 
          />
        )}
        
        {activeTab === "products" && productSubTab === "templates" && (
          <TemplateManagement
            templates={templates}
            searchQuery={searchQuery}
            onEdit={(template) => {
              setSelectedTemplate(template);
              setShowAddForm(true);
            }}
            onDelete={async (id) => {
              try {
                await api.delete(`/management/product-templates/${id}/`);
                setTemplates(templates.filter(t => t.id !== id));
              } catch (err) {
                console.error("Delete error:", err);
              }
            }}
            colors={colors}
            setShowAddForm={setShowAddForm}
            setSelectedTemplate={setSelectedTemplate}
            handlePreviewItem={(item) => {
              setPreviewItem(item);
              setShowPreview(true);
            }}
          />
        )}

        {activeTab === "products" && productSubTab === "products" && (
          <ProductManagement
            products={products}
            categories={categories}
            templates={templates}
            searchQuery={searchQuery}
            onEdit={(product) => {
              setSelectedProduct(product);
            }}
            onDelete={async (id) => {
              try {
                await api.delete(`/management/products/${id}/`);
                setProducts(products.filter(p => p.id !== id));
              } catch (err) {
                console.error("Delete error:", err);
              }
            }}
            handlePreviewItem={(item) => {
              setPreviewItem(item);
              setShowPreview(true);
            }}
            setShowAddForm={setShowAddForm}
            selectedProduct={selectedProduct}
            colors={colors}
            onCreateProduct={async (productData) => {
              setIsSaving(true);
              try {
                const response = await api.post('/management/products/', productData);
                setProducts([response.data, ...products]);
                setShowAddForm(false);
                return response.data;
              } catch (err) {
                console.error("Error creating product:", err);
                throw err;
              } finally {
                setIsSaving(false);
              }
            }}
            onCreateCategory={onCreateCategory}
            onEditCategory={onUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onReloadCategories={fetchCategories}
            businessId={businessId}
          />
        )}

        {activeTab === "orders" && (
          <OrderManagement
            orders={orders}
            setOrders={setOrders}
            colors={colors}
          />
        )}

        {activeTab === "customers" && (
          <CustomerManagement
            businessId={businessId}
            inviteCode={business?.invite_code}
            colors={colors}
            pendingCustomers={pendingCustomers}
          />
        )}

        {activeTab === "settings" && (
        <Settings businessId={businessId} />
        )}


        {showAddChoiceModal && (
          <AddChoiceModal
            onClose={() => setShowAddChoiceModal(false)}
            onSelectCategory={() => {
              setShowAddChoiceModal(false);
              setSelectedCategory(null);
              setShowCategoryModal(true);
            }}
            onSelectProduct={() => {
              setShowAddChoiceModal(false);
              setSelectedProduct(null);
              setShowAddForm(true);
            }}
            colors={colors}
          />
        )}

        {showCategoryModal && (
          <CategoryModal
            businessId={businessId}
            categories={categories}
            onClose={() => {
              setShowCategoryModal(false);
              setSelectedCategory(null);
            }}
            onSave={selectedCategory ? onUpdateCategory : onCreateCategory}
            colors={colors}
            initialCategory={selectedCategory}
          />
        )}

        {showAddForm && productSubTab === "templates" && (
          <TemplateModal
            businessId={businessId}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            setShowAddForm={setShowAddForm}
            templates={templates}
            setTemplates={setTemplates}
            colors={colors}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            onCreateTemplate={async (templateData) => {
              try {
                const response = await api.post('/management/product-templates/', templateData);
                const newTemplate = {
                  ...response.data,
                  fields: response.data.fields || [],
                  created_at: response.data.created_at || new Date().toISOString(),
                  status: response.data.status || 'draft'
                };
                setTemplates(prev => [newTemplate, ...prev]);
                setShowAddForm(false);
                return newTemplate;
              } catch (err) {
                console.error("Error creating template:", err);
                throw err;
              }
            }}
            onUpdateTemplate={async (templateData) => {
              try {
                const updatedTemplate = {
                  ...templateData,
                  fields: templateData.fields.map(field => ({
                    id: field.id,
                    label: field.label,
                    type: field.type,
                    required: field.required || false,
                    options: field.options || [],
                    currency_symbol: field.currency_symbol || "$",
                    decimal_places: field.decimal_places || 2,
                    order: field.order || 0
                  }))
                };

                const response = await api.put(`/management/product-templates/${templateData.id}/`, updatedTemplate);
                setTemplates(templates.map(t => t.id === response.data.id ? response.data : t));
                setSelectedTemplate(null);
                setShowAddForm(false);
              } catch (err) {
                console.error("Error updating template:", err);
                throw err;
              }
            }}
            api={api}
          />
        )}

        {showAddForm && productSubTab === "products" && (
          <ProductModal
            businessId={businessId}
            templates={templates}
            categories={categories}
            selectedProduct={selectedProduct}
            setShowAddForm={setShowAddForm}
            onCreateProduct={async (productData) => {
              setIsSaving(true);
              try {
                const response = await api.post('/management/products/', productData);
                setProducts([response.data, ...products]);
                setShowAddForm(false);
                return response.data;
              } catch (err) {
                console.error("Error creating product:", err);
                throw err;
              } finally {
                setIsSaving(false);
              }
            }}
            onUpdateProduct={async (formData, productId) => {
              setIsSaving(true);
              try {
                const response = await api.put(`/management/products/${productId}/`, formData);
                setProducts(products.map(p => p.id === response.data.id ? response.data : p));
                setSelectedProduct(null);
                setShowAddForm(false);
                return response.data;
              } catch (err) {
                console.error("Error updating product:", err);
                throw err;
              } finally {
                setIsSaving(false);
              }
            }}            
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            colors={colors}
          />
        )}

        {showPreview && previewItem && productSubTab === "products" && (
          <ProductPreviewModal 
            previewItem={previewItem}
            setPreviewItem={setPreviewItem}
            setShowPreview={setShowPreview}
            colors={colors}
          />
        )}

        {showPreview && previewItem && productSubTab === "templates" && (
          <PreviewModal
            previewItem={previewItem}
            setPreviewItem={setPreviewItem}
            setShowPreview={setShowPreview}
            colors={colors}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessManager;