// src/components/CustomerManager/OrderManagement.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/authService";

const OrderManagement = () => {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrderTemplate = async () => {
      try {
        const res = await api.get("/customer/template-upload/");
        const template = res.data.find(t => t.template_type === "order");
        if (!template) {
          alert("No order template uploaded yet.");
          setLoading(false);
          return;
        }

        const mappings = template.field_mappings || {};
        const generatedFields = Object.entries(mappings).map(([label, key], index) => ({
          id: index + 1,
          label,
          key,
          type: "text" // or infer from key if available
        }));

        const initialData = {};
        generatedFields.forEach(f => {
          initialData[f.key] = "";
        });

        setFields(generatedFields);
        setFormData(initialData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load order template", err);
        setLoading(false);
      }
    };

    fetchOrderTemplate();
  }, []);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        template_type: "order",
        data: formData
      };
      await api.post("/customer/orders/", payload);
      alert("Order placed successfully!");
      setFormData({});
    } catch (err) {
      console.error("Order submission failed", err);
      alert("Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.key];
    switch (field.type) {
      case "text":
        return <input type="text" className="mt-1 block w-full border rounded-md p-2" value={value} onChange={e => handleChange(field.key, e.target.value)} />;
      case "number":
        return <input type="number" className="mt-1 block w-full border rounded-md p-2" value={value} onChange={e => handleChange(field.key, e.target.value)} />;
      case "date":
        return <input type="date" className="mt-1 block w-full border rounded-md p-2" value={value} onChange={e => handleChange(field.key, e.target.value)} />;
      case "boolean":
        return (
          <input
            type="checkbox"
            className="mt-2"
            checked={value}
            onChange={e => handleChange(field.key, e.target.checked)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Place a New Order</h2>

        {loading ? (
          <p className="text-gray-600">Loading order form...</p>
        ) : fields.length === 0 ? (
          <p className="text-gray-600">No fields defined for the order form.</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                {renderField(field)}
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;