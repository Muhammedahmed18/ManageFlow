import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import OrderManagement from './OrderManagement';
import InvoiceManagement from './InvoiceManagement';
import ProductManagement from './ProductManagement';
import Settings from './Settings';
import ProductPreviewModal from '../CustomerManager/modals/ProductPreviewModal';
import InvoiceCreator from './modals/InvoiceCreator';
import { FileText, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/authService';

const BusinessManager = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [productSubTab, setProductSubTab] = useState("products");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [productMenuExpanded, setProductMenuExpanded] = useState(true);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);


  const [selectedProduct, setSelectedProduct] = useState(null);

  const [previewItem, setPreviewItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  // InvoiceCreator moved to InvoiceManagement component


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



  const fetchBusiness = async () => {
    try {
      const role = sessionStorage.getItem('role');
      let endpoint;
      
      if (role === 'manufacturer') {
        endpoint = `/business/manufacturer/businesses/${businessId}/`;
      } else {
        endpoint = `/management/customer/business/${businessId}/`;
      }
      
      const response = await api.get(endpoint);
      setBusiness(response.data || null);
    } catch (err) {
      console.error("Error fetching business:", err);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Fetching products for business:', businessId);
      const productsRes = await api.get(`/management/products/?business=${businessId}`);
      console.log('Products response:', productsRes.data);
      
      // Ensure we're getting an array
      const productsArray = Array.isArray(productsRes.data) ? productsRes.data : [];
      console.log('Products array length:', productsArray.length);
      
      setProducts(productsArray);
    } catch (err) {
      console.error("Error fetching data:", err);
      setProducts([]); // Set empty array on error
    }
  };

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for business:', businessId);
      const role = sessionStorage.getItem('role');
      if (role === 'manufacturer') {
        const response = await api.get(`/management/manufacturer/orders/?business=${businessId}`);
        console.log('Orders response:', response.data);
        
        // Ensure we're getting an array
        const ordersArray = Array.isArray(response.data) ? response.data : [];
        console.log('Orders array length:', ordersArray.length);
        
        setOrders(ordersArray);
      } else {
        setOrders([]); // Customers don't fetch orders here
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    }
  };

  useEffect(() => {
    if (businessId) {
      console.log('BusinessManager: Loading data for business ID:', businessId);
      fetchBusiness();
      fetchData();
      fetchOrders();
    }
  }, [businessId]);





  const onCreateProduct = async (productData) => {
    setIsSaving(true);
    try {
      const response = await api.post('/management/products/', productData);
      setProducts([...products, response.data]);
      setShowAddForm(false);
      return response.data;
    } catch (err) {
      console.error("Error creating product:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const onUpdateProduct = async (productData) => {
    setIsSaving(true);
    try {
      const response = await api.put(`/management/products/${productData.id}/?business=${businessId}`, productData);
      setProducts(products.map(p => p.id === response.data.id ? response.data : p));
      setShowAddForm(false);
      return response.data;
    } catch (err) {
      console.error("Error updating product:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteProduct = async (productId) => {
    try {
      await api.delete(`/management/products/${productId}/?business=${businessId}`);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      throw err;
    }
  };



  const handleLogout = () => {
    // Clear localStorage or any auth tokens
    localStorage.clear();
    // Optionally: call a logout API endpoint here
    navigate('/login');
  };

  // Invoice creation handled by InvoiceManagement component
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);

  const handleCreateInvoiceFromHeader = () => {
    setShowInvoiceCreator(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        businessName={business?.name || ""}
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
          orders={orders}
          customers={customers}
          colors={colors}
          onLogout={handleLogout}
          onCreateInvoice={handleCreateInvoiceFromHeader}
        />

        {activeTab === "dashboard" && (
          <Dashboard 
            businessName={business?.name} 
            products={products}
            customers={customers}
            orders={orders}
            businessId={businessId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "products" && (
          <ProductManagement
            products={products}
            categories={[]}
            templates={[]}
            handlePreviewItem={(product) => {
              setPreviewItem(product);
              setShowPreview(true);
            }}
            colors={colors}
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

        {activeTab === "manufacturers" && null}

        {activeTab === "payments" && (
          <InvoiceManagement 
            businessId={businessId} 
            colors={colors} 
            showInvoiceCreator={showInvoiceCreator}
            setShowInvoiceCreator={setShowInvoiceCreator}
          />
        )}

        {activeTab === "settings" && (
          <Settings businessId={businessId} />
        )}
      </div>

      {/* Product Preview Modal */}
      {showPreview && previewItem && (
        <ProductPreviewModal
          previewItem={previewItem}
          setPreviewItem={setPreviewItem}
          setShowPreview={setShowPreview}
          colors={colors}
        />
      )}

      {/* Invoice Creator Modal - REMOVED: Using InvoiceManagement's InvoiceCreator instead */}
    </div>
  );
};

export default BusinessManager;