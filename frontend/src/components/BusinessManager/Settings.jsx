// src/components/BusinessManager/Settings.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { FiUpload, FiFile, FiSettings, FiEdit2 } from "react-icons/fi";
import toast from 'react-hot-toast';
import FieldPlacer from "./modals/FieldPlacer";

const Settings = () => {
  const [orderTemplate, setOrderTemplate] = useState(null);
  const [invoiceTemplate, setInvoiceTemplate] = useState(null);
  const [orderFileName, setOrderFileName] = useState("");
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormEditor, setShowFormEditor] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileChange = (e, setter, setFileName) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleUpload = async (type) => {
    const file = type === "order" ? orderTemplate : invoiceTemplate;
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("template_type", type);

    try {
      await api.post("/template-upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
      toast.success("Template uploaded successfully!");
      fetchTemplates();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/template-upload/");
      setTemplates(res.data);
      
      // Update file names based on existing templates
      res.data.forEach(template => {
        if (template.template_type === "order") {
          setOrderFileName(template.file.split("/").pop());
        } else if (template.template_type === "invoice") {
          setInvoiceFileName(template.file.split("/").pop());
        }
      });
    } catch (err) {
      console.error("Error loading templates", err);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const getOrderTemplate = () => {
    return templates.find(t => t.template_type === "order");
  };

  const getTemplateImageUrl = (template) => {
    if (!template?.preview_image) return null;
    // If the URL is already absolute, return it as is
    if (template.preview_image.startsWith('http')) {
      return template.preview_image;
    }
    // Otherwise, prepend the base URL
    return `http://localhost:8000${template.preview_image}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your business settings and templates</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Template Upload Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiFile className="w-5 h-5 text-blue-500" />
              Template Management
            </h2>
            
            <div className="space-y-6">
              {/* Order Template Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">Order Template</h3>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, setOrderTemplate, setOrderFileName)}
                        className="hidden"
                        id="order-template"
                      />
                      <div className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <span className="text-gray-600 truncate">
                          {orderFileName || "Choose a PDF file"}
                        </span>
                        <FiUpload className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </label>
                  <button
                    onClick={() => handleUpload("order")}
                    disabled={!orderTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload
                  </button>
                </div>
                {getOrderTemplate() && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowFormEditor(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Edit Order Form Fields
                    </button>
                  </div>
                )}
              </div>

              {/* Invoice Template Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">Invoice Template</h3>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, setInvoiceTemplate, setInvoiceFileName)}
                        className="hidden"
                        id="invoice-template"
                      />
                      <div className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <span className="text-gray-600 truncate">
                          {invoiceFileName || "Choose a PDF file"}
                        </span>
                        <FiUpload className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </label>
                  <button
                    onClick={() => handleUpload("invoice")}
                    disabled={!invoiceTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Template List Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiSettings className="w-5 h-5 text-blue-500" />
              Current Templates
            </h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : templates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No templates uploaded yet</p>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {template.template_type === "order" ? "Order Template" : "Invoice Template"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded on {new Date(template.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Editor Modal */}
      {showFormEditor && getOrderTemplate() && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Order Form Field Editor</h3>
              <button
                onClick={() => setShowFormEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="mb-4 text-sm text-gray-500">
                Click anywhere on the form to add a new field.
              </div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                🔗 <strong>Auto-fill Tip:</strong> Use field labels like <code>Price</code>, <code>Material</code>, or <code>Size</code> to auto-fill data from the product template. Matching labels will automatically populate when a customer selects a product.
              </div>
              <div className="border rounded-lg overflow-hidden">
                <FieldPlacer
                  templateId={getOrderTemplate().id}
                  templateImageUrl={getTemplateImageUrl(getOrderTemplate())}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
