import React, { useState, useEffect } from "react";
import api from "../../../services/authService";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown, FiX } from "react-icons/fi";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
];

const OrderFormBuilder = ({ businessId, onCreated, onClose }) => {
  const [templateName, setTemplateName] = useState("");
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ 
    label: "", 
    type: "text", 
    required: false, 
    description: "",
    autoProductDropdown: false
  });
  const [templateId, setTemplateId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExistingTemplate();
  }, []);

  const fetchExistingTemplate = async () => {
    try {
      console.log("Fetching order form templates...");
      const res = await api.get("/management/order-form-templates/");
      console.log("Order form templates response:", res.data);
      console.log("Looking for business ID:", businessId, "Type:", typeof businessId);
      
      // Log all templates to see what we're working with
      res.data.forEach((template, index) => {
        console.log(`Template ${index}:`, {
          id: template.id,
          business: template.business,
          businessType: typeof template.business,
          name: template.name,
          fieldsCount: template.fields?.length || 0
        });
      });
      
      const existing = res.data.find(t => {
        const businessMatch = t.business === parseInt(businessId) || t.business === businessId;
        console.log(`Checking template ${t.id}: business=${t.business} vs ${businessId}, match=${businessMatch}`);
        return businessMatch;
      });
      
      console.log("Found existing template:", existing);
      if (existing) {
        setTemplateId(existing.id);
        setTemplateName(existing.name);
        setFields(existing.fields || []);
        console.log("Set fields:", existing.fields);
      } else {
        console.log("No existing template found for business ID:", businessId);
      }
    } catch (err) {
      console.error("Error loading template", err);
      toast.error("Failed to load existing template");
    }
  };

  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast.error("Field label cannot be empty");
      return;
    }
    const key = newField.label.toLowerCase().replace(/\s+/g, "_");
    setFields([...fields, { ...newField, key, autoProductDropdown: newField.autoProductDropdown }]);
    setNewField({ label: "", type: "text", required: false, description: "", autoProductDropdown: false });
  };

  const handleRemoveField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  const moveField = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) return;

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsSubmitting(true);
    try {
      let id = templateId;
      if (!id) {
        const res = await api.post("/management/order-form-templates/", {
          business: parseInt(businessId),
          name: templateName || "Default Order Form",
        });
        id = res.data.id;
        setTemplateId(id);
      }

      // First delete all existing fields if editing
      if (templateId) {
        await api.delete(`/management/order-form-fields/clear/${templateId}/`);
      }

      // Then create new fields
      await Promise.all(fields.map((f, index) =>
        api.post("/management/order-form-fields/", {
          template: id,
          label: f.label,
          type: f.type,
          required: f.required,
          description: f.description,
          order: index,
        })
      ));

      toast.success("Order form saved successfully!");
      onCreated && onCreated(id);
    } catch (err) {
      console.error("Failed to save form", err);
      toast.error("Failed to save order form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Form Builder</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Standard Order Form"
          />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Add New Field</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={e => {
                    const label = e.target.value;
                    const labelLower = label.toLowerCase();
                    let updatedType = newField.type;
                    let autoProductDropdown = newField.autoProductDropdown;
                    // Order number keywords
                    const orderNoKeywords = [
                      "order no",
                      "order_no",
                      "order id",
                      "order_id",
                      "order number"
                    ];
                    if (orderNoKeywords.some(keyword => labelLower.includes(keyword))) {
                      updatedType = "text";
                      autoProductDropdown = false;
                    } else if (labelLower.includes("product")) {
                      updatedType = "dropdown";
                      autoProductDropdown = true;
                    } else if (newField.autoProductDropdown) {
                      updatedType = "text";
                      autoProductDropdown = false;
                    }
                    setNewField({ ...newField, label, type: updatedType, autoProductDropdown });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g. Material Type"
                />
                {newField.label.toLowerCase().includes("product") && (
                  <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    🔗 This field will auto-link to the selected product and auto-fill product details.
                  </div>
                )}
                {[
                  "order no",
                  "order_no",
                  "order id",
                  "order_id",
                  "order number"
                ].some(keyword => newField.label.toLowerCase().includes(keyword)) && (
                  <div className="mt-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                    ℹ️ This field will be auto-generated during order placement and cannot be edited by the customer.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                <select
                  value={newField.type}
                  onChange={e => setNewField({ ...newField, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  disabled={newField.label.toLowerCase().includes("product") || [
                    "order no",
                    "order_no",
                    "order id",
                    "order_id",
                    "order number"
                  ].some(keyword => newField.label.toLowerCase().includes(keyword))}
                >
                  {fieldTypes.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required-field"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="required-field" className="ml-2 block text-sm text-gray-700">
                  Required Field
                </label>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="Help text for this field..."
                value={newField.description}
                onChange={(e) => setNewField({ ...newField, description: e.target.value })}
              />
            </div>
            
            <button
              onClick={handleAddField}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Field
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Form Fields</h3>
            <span className="text-sm text-gray-500">{fields.length} {fields.length === 1 ? 'field' : 'fields'}</span>
          </div>
          
          {fields.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No fields added yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first field above</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {fields.map((field, idx) => (
                <li
                  key={idx}
                  className="group flex items-start justify-between bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{field.label}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {fieldTypes.find(ft => ft.value === field.type)?.label}
                      </span>
                      {field.required && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-sm text-gray-500">{field.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => moveField(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <FiChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveField(idx, "down")}
                      disabled={idx === fields.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <FiChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveField(idx)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Remove field"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            "Save Form"
          )}
        </button>
      </div>
    </div>
  );
};

export default OrderFormBuilder;