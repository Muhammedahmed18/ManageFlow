import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import OrderManagement from './OrderManagement';
import InvoiceManagement from './InvoiceManagement';
import ProductManagement from './ProductManagement';
import Settings from './Settings';
import AIDashboard from './AIDashboard';
import ProductPreviewModal from '../CustomerManager/modals/ProductPreviewModal';
import InvoiceCreator from './modals/InvoiceCreator';

import { FileText, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/authService';

const BusinessManager = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);


  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingCustomers, setPendingCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);

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
      
      // Add timeout and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const productsRes = await api.get(`/management/products/?business=${businessId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Products response:', productsRes.data);
      
      // Ensure we're getting an array
      const productsArray = Array.isArray(productsRes.data) ? productsRes.data : [];
      console.log('Products array length:', productsArray.length);
      
      setProducts(productsArray);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Request timeout');
      } else {
        console.error("Error fetching data:", err);
      }
      setProducts([]); // Set empty array on error
    }
  };

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for business:', businessId);
      const role = sessionStorage.getItem('role');
      if (role === 'manufacturer') {
        // Add timeout and error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await api.get(`/management/manufacturer/orders/?business=${businessId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Orders response:', response.data);
        
        // Ensure we're getting an array
        const ordersArray = Array.isArray(response.data) ? response.data : [];
        console.log('Orders array length:', ordersArray.length);
        
        setOrders(ordersArray);
      } else {
        setOrders([]); // Customers don't fetch orders here
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Request timeout');
      } else {
        console.error("Error fetching orders:", err);
      }
      setOrders([]);
    }
  };

  const fetchInvoices = async () => {
    try {
      console.log('Fetching invoices for business:', businessId);
      const role = sessionStorage.getItem('role');
      if (role === 'manufacturer') {
        const response = await api.get(`/management/invoices/?business=${businessId}`);
        console.log('Invoices response:', response.data);
        
        // Handle potential pagination - check if response.data has a 'results' property
        let invoicesArray = [];
        if (response.data && response.data.results) {
          // Paginated response
          invoicesArray = response.data.results;
          console.log('Paginated response detected, using results array');
        } else if (Array.isArray(response.data)) {
          // Direct array response
          invoicesArray = response.data;
          console.log('Direct array response detected');
        } else {
          console.log('Unexpected response format:', typeof response.data, response.data);
        }
        
        // Enhanced debugging for invoice data
        console.log('Raw invoices response:', response.data);
        console.log('Processed invoices array:', invoicesArray);
        console.log('Invoice count by status:', invoicesArray.reduce((acc, inv) => {
          acc[inv.status] = (acc[inv.status] || 0) + 1;
          return acc;
        }, {}));
        
        console.log('Invoices array length:', invoicesArray.length);
        console.log('Paid invoices count:', invoicesArray.filter(inv => inv.status === 'paid').length);
        console.log('All invoices:', invoicesArray.map(inv => ({ id: inv.id, status: inv.status, amount: inv.total_amount })));
        
        setInvoices(invoicesArray);
      } else {
        setInvoices([]); // Customers don't fetch invoices here
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    }
  };

  useEffect(() => {
    if (businessId) {
      console.log('BusinessManager: Loading data for business ID:', businessId);
      fetchBusiness();
      fetchData();
      fetchOrders();
      fetchInvoices();
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
        currentUser={currentUser}
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
            invoices={invoices}
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



        {activeTab === "ai-dashboard" && (
          <AIDashboard businessId={businessId} colors={colors} />
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