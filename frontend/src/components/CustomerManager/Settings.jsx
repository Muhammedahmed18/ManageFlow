// src/components/CustomerManager/Settings.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSettings, FiSave, FiChevronDown, FiChevronUp } from "react-icons/fi";

const CustomerSettings = () => {
  const [orderNumberConfig, setOrderNumberConfig] = useState({
    start_number: 1,
    prefix: ''
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const fetchOrderNumberConfig = async () => {
      try {
        const response = await api.get('/customer/order-number-config/');
        setOrderNumberConfig({
          start_number: response.data.start_number,
          prefix: response.data.prefix || ''
        });
      } catch (error) {
        console.error('Failed to fetch order number config:', error);
      }
    };

    fetchOrderNumberConfig();
  }, []);

  const handleOrderNumberConfigSubmit = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);

    try {
      await api.post('/customer/order-number-config/', {
        start_number: parseInt(orderNumberConfig.start_number),
        prefix: orderNumberConfig.prefix
      });
      
      toast.success('Order number configuration updated successfully');
    } catch (error) {
      console.error('Failed to update order number config:', error);
      toast.error('Failed to update order number configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

            {/* Order Number Configuration Section */}
            <div className="mb-8">
              <button
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FiSettings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">Order Number Configuration</span>
                </div>
                {isConfigOpen ? (
                  <FiChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {isConfigOpen && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <form onSubmit={handleOrderNumberConfigSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting Order Number
                      </label>
                      <input
                        type="number"
                        value={orderNumberConfig.start_number}
                        onChange={(e) => setOrderNumberConfig(prev => ({
                          ...prev,
                          start_number: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        The next order will start from this number and increment automatically.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Number Prefix (Optional)
                      </label>
                      <input
                        type="text"
                        value={orderNumberConfig.prefix}
                        onChange={(e) => setOrderNumberConfig(prev => ({
                          ...prev,
                          prefix: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., ORD-"
                        maxLength="10"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Add a prefix to your order numbers (e.g., "ORD-" will create numbers like "ORD-1001").
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={isSavingConfig}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingConfig ? (
                          <>
                            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-5 h-5" />
                            Save Configuration
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;