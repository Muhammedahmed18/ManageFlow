import React, { useEffect, useState } from 'react';
import api from '../../../services/authService';
import { ClipLoader } from 'react-spinners';

const DynamicOrderForm = ({ templateId, onSubmit }) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await api.get(`/template-upload/${templateId}/positions/`);
        setFields(response.data || []);
        const initialData = {};
        response.data.forEach(field => {
          initialData[field.key] = '';
        });
        setFormData(initialData);
      } catch (err) {
        console.error("Failed to load template fields", err);
        setError("Failed to load form fields. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (templateId) fetchFields();
  }, [templateId]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/customer/products/");
        setProducts(res.data);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct && Array.isArray(selectedProduct.field_values)) {
      const updates = {};
      fields.forEach(field => {
        const formLabel = field.label.toLowerCase().trim();
        selectedProduct.field_values.forEach(item => {
          const productLabel = item.field?.label?.toLowerCase().trim();
          if (formLabel === productLabel) {
            updates[field.key] = item.value;
          }
        });
      });
      console.log("Auto-filling with:", updates);
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [selectedProduct, fields]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (key === "product" || key.toLowerCase().includes("product")) {
      const matched = products.find(p => p.name === value);
      console.log("Selected product object:", matched);
      setSelectedProduct(matched || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onSubmit) await onSubmit(formData);
    } catch (err) {
      console.error("Submission error", err);
      setError("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
        <ClipLoader size={35} color="#3B82F6" />
        <p className="mt-4 text-gray-600">Loading form configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <p className="text-gray-600">No fields defined for this template.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">Order Form</h2>
      <form autoComplete="on" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              {(field.label.toLowerCase().includes("product") || field.key === "product") ? (
                <select
                  name={field.key}
                  autoComplete="on"
                  value={formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Select Product --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              ) : (
                field.type === 'textarea' ? (
                  <textarea
                    name={field.key}
                    autoComplete="on"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    required={field.required}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    name={field.key}
                    autoComplete="on"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required={field.required}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  />
                )
              )}
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-md">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <ClipLoader size={20} color="#ffffff" className="mr-2" /> Processing...
              </>
            ) : (
              'Submit Order'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicOrderForm;
