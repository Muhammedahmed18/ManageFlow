import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "./Dashboard";
import Settings from "./Settings";
import OrderManagement from "./OrderManagement";
import api from "../../services/authService";
import ProductPreviewModal from "../BusinessManager/modals/ProductPreviewModal";
import DynamicOrderForm from "../BusinessManager/modals/DynamicOrderForm";

const CustomerManager = () => {
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [productSubTab, setProductSubTab] = useState("products");
  const [businessName, setBusinessName] = useState("Your Business");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [orderTemplate, setOrderTemplate] = useState(null);
  const [invoiceTemplate, setInvoiceTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [templateId, setTemplateId] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // ✅ This is the missing state for order list refresh
  const [orderListRefreshKey, setOrderListRefreshKey] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = `Customer | ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusResponse = await api.get("/management/auth/customer-status/");
        setBusinessName(statusResponse.data.business_name || "Your Business");

        const fetchProducts = async () => {
          try {
            const res = await api.get("/management/customer/products/");
            setProducts(res.data);
          } catch (err) {
            console.error("Error loading products", err);
            toast.error("Failed to load products");
          }
        };
        fetchProducts();

        setLoading(false);
      } catch (err) {
        if (err.response?.status === 403) {
          navigate("/pending-approval");
        }
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await api.get("/management/customer/order-form-template/");
        setOrderTemplate(res.data);
      } catch (err) {
        console.error("Error loading order form template", err);
        toast.error("Failed to load order form template");
      }
    };
    fetchTemplate();
  }, []);

  useEffect(() => {
    if (orderTemplate && orderTemplate.id) {
      setTemplateId(orderTemplate.id);
    }
  }, [orderTemplate]);

  const computeFilteredProducts = (products, query) => {
    return products.filter((product) => {
      return (
        (product?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (product?.category?.name || '').toLowerCase().includes(query.toLowerCase())
      );
    });
  };

  const filteredProducts = useMemo(() => 
    computeFilteredProducts(products, searchQuery),
    [products, searchQuery]
  );

  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleUpload = async (type) => {
    const file = type === "order" ? orderTemplate : invoiceTemplate;
    if (!file) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("template", file);

    const endpoint = type === "order" ? "/api/templates/order/" : "/api/templates/invoice/";

    try {
      await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
      alert("Template uploaded successfully!");
    } catch (error) {
      alert("Upload failed.");
    }
  };

  const handleLogout = async () => {
  const refresh = sessionStorage.getItem("refreshToken");
  const token = sessionStorage.getItem("accessToken");

  try {
    if (refresh && token) {
      await api.post("/auth/logout/", { refresh }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (err) {
    console.warn("Logout error:", err);
  }

  sessionStorage.clear();
  navigate("/login");
};


  if (loading) {
    return (
      <div className="p-10 text-center">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        productSubTab={productSubTab}
        setProductSubTab={setProductSubTab}
        userType="customer"
        businessName={businessName}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          activeTab={activeTab}
          productSubTab={productSubTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          products={products}
          templates={[]}
          orders={[]}
          customers={[]}
          userType="customer"
          setActiveTab={setActiveTab}
          navigate={navigate}
          onPlaceOrderClick={() => setShowOrderForm(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
            <Dashboard products={products} customers={[]} />
          )}

          {activeTab === "products" && (
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-lg text-gray-800">Available Products</h2>
                </div>
                {filteredProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Template</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600">{product.custom_id || '-'}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setPreviewProduct(product);
                                  setShowPreview(true);
                                }}
                                className="font-medium text-left text-blue-700 hover:underline"
                              >
                                {product.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name || 'Uncategorized'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{product.template?.name || 'No template'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(product.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg font-medium text-gray-600">No products found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <Settings 
              orderTemplate={orderTemplate}
              invoiceTemplate={invoiceTemplate}
              onFileChange={handleFileChange}
              onUpload={handleUpload}
            />
          )}

          {activeTab === "orders" && <OrderManagement key={orderListRefreshKey} />}

          {/* Product Preview Modal */}
          {showPreview && previewProduct && (
            <ProductPreviewModal
              previewItem={previewProduct}
              setPreviewItem={setPreviewProduct}
              setShowPreview={setShowPreview}
              colors={{ textDark: "#1f2937   " }}
            />
          )}

          {/* Order Form Modal */}
          {showOrderForm && templateId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
                <div className="flex justify-between items-center px-4 py-3 border-b">
                  <h3 className="text-lg font-medium text-gray-800">New Order</h3>
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <DynamicOrderForm
                    templateId={templateId}
                    isEdit={false}
                    initialData={{}}
                    onSubmit={async (formData) => {
                      try {
                        await api.post("/management/customer/orders/", {
                          template_type: "order",
                          data: formData
                        });
                        toast.success("Order submitted successfully!");
                        setShowOrderForm(false);
                        setOrderListRefreshKey(prev => prev + 1); // 🔁 trigger refresh
                      } catch (err) {
                        console.error("Failed to submit order", err);
                        toast.error("Failed to submit order.");
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CustomerManager;