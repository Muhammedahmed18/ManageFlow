import React, { useEffect, useState } from 'react';
import api from '../../../services/authService'; // adjust path as needed
import { ClipLoader } from 'react-spinners'; // for loading animation

const DynamicOrderForm = ({ templateId, onSubmit }) => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch field positions
  useEffect(() => {
    const fetchFields = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await api.get(`/template-upload/${templateId}/positions/`);
        setFields(response.data || []);
        
        // Initialize form data with empty values for each field
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

  // Handle field input changes
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Submit form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);  // send back to parent
      }
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
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  name={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required={field.required}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  name={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={field.required}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <ClipLoader size={20} color="#ffffff" className="mr-2" />
                Processing...
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