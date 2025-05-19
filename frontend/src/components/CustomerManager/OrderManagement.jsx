import React, { useEffect, useState } from "react";
import api from "../../services/authService";
import DynamicOrderForm from "../BusinessManager/modals/DynamicOrderForm";

const OrderManagement = () => {
  const [loading, setLoading] = useState(true);

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

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch order template", err);
        setLoading(false);
      }
    };

    fetchOrderTemplate();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Order Management</h2>

        {loading ? (
          <p className="text-gray-600">Loading order information...</p>
        ) : (
          <p className="text-gray-600">View and manage your orders here.</p>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;