import React, { useState, useRef, useEffect } from 'react';
import api from '../../../services/authService';
import { Dialog } from '@headlessui/react';

const FieldPlacer = ({ templateId, templateImageUrl }) => {
  const [placedFields, setPlacedFields] = useState([]);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldPosition, setFieldPosition] = useState({ x: 0, y: 0 });
  const [fieldLabel, setFieldLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productFields, setProductFields] = useState(['price', 'material', 'size']);
  const imageRef = useRef(null);

  useEffect(() => {
    const fetchExistingFields = async () => {
      try {
        const response = await api.get(`/template-upload/${templateId}/positions/`);
        setPlacedFields(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch existing fields", err);
        setError("Failed to load existing fields");
        setPlacedFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingFields();
  }, [templateId]);

  const handleImageClick = (e) => {
    if (isLoading) return;
    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    setFieldPosition({ x: clickX, y: clickY });
    setIsFieldModalOpen(true);
  };

  const handleAddField = async () => {
    if (!fieldLabel.trim()) {
      alert("Field label cannot be empty");
      return;
    }

    const key = fieldLabel.toLowerCase().replace(/\s+/g, '_');

    const payload = {
      label: fieldLabel,
      key,
      x: fieldPosition.x,
      y: fieldPosition.y,
      page: 1,
      font_size: 12,
    };

    try {
      const response = await api.post(`/template-upload/${templateId}/positions/`, payload);
      setPlacedFields([...placedFields, response.data]);
      setFieldLabel('');
      setIsFieldModalOpen(false);
    } catch (err) {
      console.error("Failed to save field position", err);
      alert(`Failed to save field: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      await api.delete(`/template-upload/${templateId}/positions/${fieldId}/`);
      setPlacedFields(placedFields.filter(field => field.id !== fieldId));
    } catch (err) {
      console.error("Failed to delete field", err);
      alert(`Failed to delete field: ${err.response?.data?.message || err.message}`);
    }
  };

  const isMatchingProductField = productFields.includes(fieldLabel.toLowerCase().trim());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        ref={imageRef}
        src={templateImageUrl}
        alt="Template Preview"
        onClick={handleImageClick}
        className="border shadow-lg w-full max-w-4xl cursor-crosshair"
      />

      {placedFields.map((field) => (
        <div
          key={field.id}
          className="absolute group"
          style={{
            top: `${field.y}px`,
            left: `${field.x}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            <div className="text-xs bg-yellow-300 px-2 py-1 rounded shadow flex items-center">
              <span className="flex-1 text-center">{field.label}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteField(field.id);
              }}
              className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete field"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Field Entry Modal */}
      <Dialog
        open={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="bg-white rounded-lg p-6 max-w-sm w-full z-10">
          <Dialog.Title className="text-lg font-bold mb-4">Add Field</Dialog.Title>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Price"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
            />
            <p className={`mt-1 text-xs ${isMatchingProductField ? 'text-green-600' : 'text-red-500'}`}>
              {isMatchingProductField
                ? '✅ This field will auto-fill from product data.'
                : '⚠️ This field does not match any product data field.'}
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsFieldModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddField}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Field
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default FieldPlacer;
