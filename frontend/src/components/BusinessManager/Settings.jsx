// src/components/BusinessManager/Settings.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FieldPlacer from "./modals/FieldPlacer";

const Settings = () => {
  const [orderTemplate, setOrderTemplate] = useState(null);
  const [invoiceTemplate, setInvoiceTemplate] = useState(null);
  const [uploadedTemplates, setUploadedTemplates] = useState({});
  const [orderFileName, setOrderFileName] = useState("No file chosen");
  const [invoiceFileName, setInvoiceFileName] = useState("No file chosen");
  const [isUploading, setIsUploading] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);

  const handleFileChange = (e, setter, setFileName) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleUpload = async (type) => {
    const file = type === "order" ? orderTemplate : invoiceTemplate;
    if (!file) {
      toast.warning("Please select a file first", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${type} template...`, {
      position: "top-right",
    });

    const formData = new FormData();
    formData.append("template_type", type);
    formData.append("file", file);

    try {
      const response = await api.post("/template-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });      

      setUploadedTemplates((prev) => ({ ...prev, [type]: response.data }));
      if (type === "order") setOrderFileName(response.data.file.split("/").pop());
      if (type === "invoice") setInvoiceFileName(response.data.file.split("/").pop());

      toast.update(toastId, {
        render: `${type.charAt(0).toUpperCase() + type.slice(1)} template uploaded successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Upload error:", error);
      const message = error?.response?.data?.detail || "Upload failed.";
      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/template-upload/")
        const uploads = {};
        for (const item of res.data) {
          uploads[item.template_type] = item;
        }
        setUploadedTemplates(uploads);
        if (uploads.order) setOrderFileName(uploads.order.file.split("/").pop());
        if (uploads.invoice) setInvoiceFileName(uploads.invoice.file.split("/").pop());
      } catch (err) {
        console.error("Failed to load uploaded templates", err);
        toast.error("Failed to load templates", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Document Templates</h2>
            <div className="flex space-x-2">
              {uploadedTemplates.order && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Order Template Uploaded
                </span>
              )}
              {uploadedTemplates.invoice && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Invoice Template Uploaded
                </span>
              )}
            </div>
          </div>

          {/* Order Template Upload */}
          <div className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800">Order Form Template</h3>
              {uploadedTemplates.order && (
                <span className="text-sm text-blue-600">
                  Last uploaded: {new Date(uploadedTemplates.order.uploaded_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => handleFileChange(e, setOrderTemplate, setOrderFileName)}
                  className="hidden"
                  id="order-file"
                />
                <label
                  htmlFor="order-file"
                  className="inline-flex items-center px-4 py-3 bg-white border border-blue-300 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-blue-700 font-medium">Choose File</span>
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  {orderFileName}
                </p>
              </div>
              <button
                onClick={() => handleUpload("order")}
                disabled={isUploading}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? "Uploading..." : "Upload Order Template"}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Accepted formats: PDF, PNG, JPG (Max size: 5MB)
            </p>

            {/* Order Form Editor Button */}
            {uploadedTemplates.order && uploadedTemplates.order.preview_image && (
              <div className="mt-6">
                <button
                  onClick={() => setShowFormEditor(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Edit Order Form Fields
                </button>
              </div>
            )}
          </div>

          {/* Invoice Template Upload */}
          <div className="p-6 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Invoice Template</h3>
              {uploadedTemplates.invoice && (
                <span className="text-sm text-green-600">
                  Last uploaded: {new Date(uploadedTemplates.invoice.uploaded_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg"
                  onChange={(e) => handleFileChange(e, setInvoiceTemplate, setInvoiceFileName)}
                  className="hidden"
                  id="invoice-file"
                />
                <label
                  htmlFor="invoice-file"
                  className="inline-flex items-center px-4 py-3 bg-white border border-green-300 rounded-lg shadow-sm cursor-pointer hover:bg-green-50 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-green-700 font-medium">Choose File</span>
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  {invoiceFileName}
                </p>
              </div>
              <button
                onClick={() => handleUpload("invoice")}
                disabled={isUploading}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? "Uploading..." : "Upload Invoice Template"}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Accepted formats: PDF, PNG, JPG (Max size: 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Form Editor Overlay */}
      {showFormEditor && uploadedTemplates.order && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Order Form Field Editor</h3>
              <button
                onClick={() => setShowFormEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
                  templateId={uploadedTemplates.order.id}
                  templateImageUrl={`http://localhost:8000${uploadedTemplates.order.preview_image}`}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
