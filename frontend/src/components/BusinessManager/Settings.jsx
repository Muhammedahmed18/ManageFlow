import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { FiUpload, FiFile, FiSettings, FiEdit2, FiX, FiFileText, FiDownload, FiPlus } from "react-icons/fi";
import toast from 'react-hot-toast';
import OrderFormBuilder from "./modals/OrderFormBuilder";
import FieldPlacer from "./modals/FieldPlacer";

const Settings = ({ businessId }) => {
  const [orderTemplate, setOrderTemplate] = useState(null);
  const [invoiceTemplate, setInvoiceTemplate] = useState(null);
  const [orderFileName, setOrderFileName] = useState("");
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showStandaloneFormBuilder, setShowStandaloneFormBuilder] = useState(false);

  // Helper functions
  const getOrderTemplate = () => templates.find(t => t.template_type === "order");
  const getInvoiceTemplate = () => templates.find(t => t.template_type === "invoice");

  const getTemplateUrl = (template) => {
    return template?.preview_image_url || null;
  };

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
      await api.post("/management/template-upload/", formData, {
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

  const handleDownload = (template) => {
    const url = getTemplateUrl(template);
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = template.file.split('/').pop();
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await api.delete(`/management/template-upload/${templateId}/`);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error("Failed to delete template");
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/management/template-upload/");
      console.log("Templates response:", res.data);
      setTemplates(res.data);
      
      res.data.forEach(template => {
        console.log(`Template ${template.template_type}:`, {
          id: template.id,
          file: template.file,
          preview_image: template.preview_image,
          uploaded_at: template.uploaded_at
        });
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

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-800">Template Settings</h1>
          <p className="text-sm text-gray-500">Manage your order and invoice templates</p>
        </div>

        <div className="space-y-4">
          {/* Digital Form Section */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFileText className="text-blue-500 text-sm" />
                <h2 className="font-medium">Digital Order Form</h2>
              </div>
              <button
                onClick={() => setShowStandaloneFormBuilder(true)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                <FiPlus size={12} />
                <span>Configure</span>
              </button>
            </div>
          </div>

          {/* PDF Templates Section */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FiFile className="text-blue-500 text-sm" />
              <h2 className="font-medium">PDF Templates</h2>
            </div>
            
            <div className="space-y-3">
              {/* Order Template */}
              <div className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Order Template</h3>
                  {getOrderTemplate() && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowFormEditor(true)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                      >
                        <FiEdit2 size={12} />
                        <span>Edit Fields</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, setOrderTemplate, setOrderFileName)}
                        className="hidden"
                        id="order-template"
                      />
                      <div className="flex items-center justify-between px-2 py-1.5 border rounded text-xs cursor-pointer hover:bg-gray-50">
                        <span className="truncate">
                          {orderFileName || "Select file"}
                        </span>
                        <FiUpload className="text-gray-400 text-xs" />
                      </div>
                    </div>
                  </label>
                  <button
                    onClick={() => handleUpload("order")}
                    disabled={!orderTemplate}
                    className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Upload
                  </button>
                </div>
              </div>

              {/* Invoice Template */}
              <div className="border rounded p-3">
                <h3 className="text-sm font-medium mb-2">Invoice Template</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, setInvoiceTemplate, setInvoiceFileName)}
                        className="hidden"
                        id="invoice-template"
                      />
                      <div className="flex items-center justify-between px-2 py-1.5 border rounded text-xs cursor-pointer hover:bg-gray-50">
                        <span className="truncate">
                          {invoiceFileName || "Select file"}
                        </span>
                        <FiUpload className="text-gray-400 text-xs" />
                      </div>
                    </div>
                  </label>
                  <button
                    onClick={() => handleUpload("invoice")}
                    disabled={!invoiceTemplate}
                    className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Templates */}
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FiSettings className="text-blue-500 text-sm" />
              <h2 className="font-medium">Current Templates</h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No templates uploaded</p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                  >
                    <div className="truncate">
                      <span className="font-medium">
                        {template.template_type === "order" ? "Order" : "Invoice"}:
                      </span>
                      <span className="text-gray-500 ml-1">
                        {template.file.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {new Date(template.uploaded_at).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Template"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStandaloneFormBuilder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-semibold">Order Form Builder</h3>
              <button
                onClick={() => setShowStandaloneFormBuilder(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-3 overflow-auto">
              {businessId && (
                <OrderFormBuilder
                  businessId={businessId}
                  onCreated={() => {
                    toast.success("Form saved");
                    setShowStandaloneFormBuilder(false);
                  }}
                  onClose={() => setShowStandaloneFormBuilder(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showFormEditor && getOrderTemplate() && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-semibold">PDF Field Placement</h3>
              <button
                onClick={() => setShowFormEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-3 overflow-auto">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📋 Drag & Drop Field Mapping</h4>
                <p className="text-sm text-blue-700">
                  <strong>How it works:</strong> Drag digital form fields from the left panel and drop them onto the PDF template. 
                  The coordinates will be automatically captured and saved. When customers fill out orders, 
                  the data will be placed at these exact positions on the PDF.
                </p>
              </div>
              <FieldPlacer
                templateId={getOrderTemplate().id}
                templateImageUrl={getTemplateUrl(getOrderTemplate())}
                previewDpi={getOrderTemplate().preview_dpi}
                pdfWidthPt={getOrderTemplate().pdf_width_pt}
                pdfHeightPt={getOrderTemplate().pdf_height_pt}
                businessId={businessId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;