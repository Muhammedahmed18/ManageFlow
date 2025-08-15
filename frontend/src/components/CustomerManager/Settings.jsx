import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { FiHash, FiTrash2, FiUser, FiShield, FiAlertTriangle } from "react-icons/fi";
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AccountDeletionModal from '../shared/AccountDeletionModal';

const Settings = ({ businessId }) => {
  const { getRole, logout } = useAuth();
  const role = getRole();
  const [numberConfigs, setNumberConfigs] = useState({ 
    order: null,
    customer_invoice: null
  });
  const [numberConfigLoading, setNumberConfigLoading] = useState(false);
  const [numberConfigForms, setNumberConfigForms] = useState({
    order: { start_number: '', prefix: '' },
    customer_invoice: { start_number: '', prefix: '' }
  });
  const [numberConfigSaving, setNumberConfigSaving] = useState({ 
    order: false,
    customer_invoice: false
  });
  const [activeTab, setActiveTab] = useState('order');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    if (role === 'customer' && businessId) {
      setNumberConfigLoading(true);
      
      const fetchNumberConfigs = async () => {
        try {
          // Fetch all number configs for this business first
          const allConfigsResponse = await api.get(`/management/number-configs/?business=${businessId}`);
          
          let allConfigs = [];
          if (allConfigsResponse.data.results) {
            allConfigs = allConfigsResponse.data.results;
          } else if (Array.isArray(allConfigsResponse.data)) {
            allConfigs = allConfigsResponse.data;
          } else {
            allConfigs = [allConfigsResponse.data];
          }
          
          // Filter by config_type to get the correct configurations
          const orderConfig = allConfigs.find(config => config.config_type === 'order') || null;
          const customerInvoiceConfig = allConfigs.find(config => config.config_type === 'customer_invoice') || null;
          
          setNumberConfigs({
            order: orderConfig,
            customer_invoice: customerInvoiceConfig
          });
          
          // Set form values
          setNumberConfigForms({
            order: {
              start_number: orderConfig?.start_number || '',
              prefix: orderConfig?.prefix || ''
            },
            customer_invoice: {
              start_number: customerInvoiceConfig?.start_number || '',
              prefix: customerInvoiceConfig?.prefix || ''
            }
          });
          

          
        } catch (error) {
          console.error('Error fetching number configs:', error);
          console.error('Error response:', error.response?.data);
          // Don't show error toast for 404 - just means no config exists yet
          if (error.response?.status !== 404) {
            toast.error('Failed to load number configurations');
          }
        } finally {
          setNumberConfigLoading(false);
        }
      };
      
      fetchNumberConfigs();
    }
  }, [businessId, role]);

  const handleNumberConfigSave = async (e, configType) => {
    e.preventDefault();
    setNumberConfigSaving(prev => ({ ...prev, [configType]: true }));
    
    try {
      const formData = numberConfigForms[configType];
      
      const payload = {
        business: businessId,
        config_type: configType,
        start_number: parseInt(formData.start_number),
        current_number: parseInt(formData.start_number),
        prefix: formData.prefix || ''
      };

      if (numberConfigs[configType]) {
        // Update existing config - only send fields that can be updated
        const updatePayload = {
          start_number: parseInt(formData.start_number),
          current_number: parseInt(formData.start_number),
          prefix: formData.prefix || ''
        };
        await api.put(`/management/number-configs/${numberConfigs[configType].id}/`, updatePayload);
        toast.success("Number configuration updated successfully!");
      } else {
        // Create new config
        await api.post("/management/number-configs/", payload);
        toast.success("Number configuration created successfully!");
      }

      // Refresh the configs by fetching all configs again
      const allConfigsResponse = await api.get(`/management/number-configs/?business=${businessId}`);
      console.log(`Refresh response:`, allConfigsResponse.data);
      
      let allConfigs = [];
      if (allConfigsResponse.data.results) {
        allConfigs = allConfigsResponse.data.results;
      } else if (Array.isArray(allConfigsResponse.data)) {
        allConfigs = allConfigsResponse.data;
      } else {
        allConfigs = [allConfigsResponse.data];
      }
      
      // Filter by config_type to get the correct configurations
      const orderConfig = allConfigs.find(config => config.config_type === 'order') || null;
      const customerInvoiceConfig = allConfigs.find(config => config.config_type === 'customer_invoice') || null;
      
      console.log(`New filtered configs:`, { order: orderConfig, customer_invoice: customerInvoiceConfig });
      
      setNumberConfigs({
        order: orderConfig,
        customer_invoice: customerInvoiceConfig
      });
      
    } catch (err) {
      console.error(`Save number config error for ${configType}:`, err);
      console.error('Error response:', err.response?.data);
      toast.error("Failed to save number configuration");
    } finally {
      setNumberConfigSaving(prev => ({ ...prev, [configType]: false }));
    }
  };

  const handleResetNumbering = async (configType) => {
    if (!numberConfigs[configType]) return;
    
    setNumberConfigSaving(prev => ({ ...prev, [configType]: true }));
    
    try {
      console.log(`Resetting numbering for ${configType}:`, numberConfigs[configType]);
      
      await api.put(`/management/number-configs/${numberConfigs[configType].id}/`, {
        current_number: numberConfigs[configType].start_number
      });
      
      // Update local state
      setNumberConfigs(prev => ({
        ...prev,
        [configType]: {
          ...prev[configType],
          current_number: prev[configType].start_number
        }
      }));
      
      toast.success("Numbering reset successfully!");
    } catch (err) {
      console.error(`Reset numbering error for ${configType}:`, err);
      toast.error("Failed to reset numbering");
    } finally {
      setNumberConfigSaving(prev => ({ ...prev, [configType]: false }));
    }
  };

  const handleDeleteNumberConfig = async (configType) => {
    if (!numberConfigs[configType]) return;
    
    const configLabel = configType === 'order' ? 'Order' : 'Customer Invoice';
    
    if (!window.confirm(`Are you sure you want to delete the ${configLabel.toLowerCase()} numbering configuration? This action cannot be undone.`)) {
      return;
    }
    
    setNumberConfigSaving(prev => ({ ...prev, [configType]: true }));
    
    try {
      console.log(`Deleting ${configType} config:`, numberConfigs[configType]);
      
      await api.delete(`/management/number-configs/${numberConfigs[configType].id}/`);
      
      // Update local state to remove the deleted config
      setNumberConfigs(prev => ({
        ...prev,
        [configType]: null
      }));
      
      // Reset form values for the deleted config
      setNumberConfigForms(prev => ({
        ...prev,
        [configType]: { start_number: '', prefix: '' }
      }));
      
      toast.success(`${configLabel} numbering configuration deleted successfully!`);
    } catch (err) {
      console.error(`Delete number config error for ${configType}:`, err);
      toast.error("Failed to delete number configuration");
    } finally {
      setNumberConfigSaving(prev => ({ ...prev, [configType]: false }));
    }
  };

  const handleAccountDeletionSuccess = () => {
    // Logout user after successful account deletion
    logout(true); // Skip API call since account is already deleted
  };

  const getTabLabel = (configType) => {
    switch (configType) {
      case 'order':
        return 'Orders';
      case 'customer_invoice':
        return 'Invoices';
      default:
        return configType;
    }
  };

  const getTabIcon = (configType) => {
    switch (configType) {
      case 'order':
        return '📋';
      case 'customer_invoice':
        return '🧾';
      default:
        return '⚙️';
    }
  };

  const getCurrentNumber = (configType) => {
    const config = numberConfigs[configType];
    if (!config) return null;
    return config.prefix ? `${config.prefix}-${config.current_number}` : config.current_number;
  };

  // Debug: Log current state
  useEffect(() => {

  }, [numberConfigs, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Business Settings</h1>
          <p className="text-gray-600">Manage your business configuration</p>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Number Configuration */}
          {role === 'customer' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                  <FiHash className="w-4 h-4" />
                </div>
                <h2 className="font-medium">Number Configuration</h2>
              </div>
              
              {/* Compact Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                {['order', 'customer_invoice'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm">{getTabIcon(tab)}</span>
                    <span>{getTabLabel(tab)}</span>
                    {getCurrentNumber(tab) && (
                      <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                        {getCurrentNumber(tab)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {numberConfigLoading ? (
                <div className="py-2 text-center text-sm text-gray-500">Loading configuration...</div>
              ) : (
                <div className="space-y-4">
                  {/* Order Numbering Tab */}
                  {activeTab === 'order' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Order Numbering</h3>
                        {numberConfigs.order && (
                          <span className="text-xs text-gray-500">
                            Current: <span className="font-medium">{getCurrentNumber('order')}</span>
                          </span>
                        )}
                      </div>
                      {!numberConfigs.order && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700">
                            <strong>Setup Required:</strong> Configure your order numbering format to automatically generate order numbers.
                          </p>
                        </div>
                      )}
                      <form onSubmit={(e) => handleNumberConfigSave(e, 'order')} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Number</label>
                            <input
                              type="number"
                              name="start_number"
                              value={numberConfigForms.order.start_number}
                              onChange={(e) => setNumberConfigForms(prev => ({
                                ...prev,
                                order: { ...prev.order, start_number: e.target.value }
                              }))}
                              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs.order ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                              min={1}
                              required
                              disabled={numberConfigs.order}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
                            <input
                              type="text"
                              name="prefix"
                              value={numberConfigForms.order.prefix}
                              onChange={(e) => setNumberConfigForms(prev => ({
                                ...prev,
                                order: { ...prev.order, prefix: e.target.value }
                              }))}
                              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs.order ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                              maxLength={10}
                              placeholder="ORD-"
                              disabled={numberConfigs.order}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!numberConfigs.order && (
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={numberConfigSaving.order}
                            >
                              {numberConfigSaving.order ? 'Saving...' : 'Save Format'}
                            </button>
                          )}
                          {numberConfigs.order && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleResetNumbering('order')}
                                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                disabled={numberConfigSaving.order}
                              >
                                Reset Numbering
                              </button>
                              <div className="flex-1"></div>
                              <button
                                type="button"
                                onClick={() => handleDeleteNumberConfig('order')}
                                className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-1"
                                disabled={numberConfigSaving.order}
                                title="Delete configuration"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Customer Invoice Numbering Tab */}
                  {activeTab === 'customer_invoice' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Customer Invoice Numbering</h3>
                        {numberConfigs.customer_invoice && (
                          <span className="text-xs text-gray-500">
                            Current: <span className="font-medium">{getCurrentNumber('customer_invoice')}</span>
                          </span>
                        )}
                      </div>
                      {!numberConfigs.customer_invoice && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700">
                            <strong>Setup Required:</strong> Configure your invoice numbering format to automatically generate invoice numbers.
                          </p>
                        </div>
                      )}
                      <form onSubmit={(e) => handleNumberConfigSave(e, 'customer_invoice')} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Number</label>
                            <input
                              type="number"
                              name="start_number"
                              value={numberConfigForms.customer_invoice.start_number}
                              onChange={(e) => setNumberConfigForms(prev => ({
                                ...prev,
                                customer_invoice: { ...prev.customer_invoice, start_number: e.target.value }
                              }))}
                              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs.customer_invoice ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                              min={1}
                              required
                              disabled={numberConfigs.customer_invoice}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
                            <input
                              type="text"
                              name="prefix"
                              value={numberConfigForms.customer_invoice.prefix}
                              onChange={(e) => setNumberConfigForms(prev => ({
                                ...prev,
                                customer_invoice: { ...prev.customer_invoice, prefix: e.target.value }
                              }))}
                              className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs.customer_invoice ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                              maxLength={10}
                              placeholder="CUST-INV-"
                              disabled={numberConfigs.customer_invoice}
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!numberConfigs.customer_invoice && (
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={numberConfigSaving.customer_invoice}
                            >
                              {numberConfigSaving.customer_invoice ? 'Saving...' : 'Save Format'}
                            </button>
                          )}
                          {numberConfigs.customer_invoice && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleResetNumbering('customer_invoice')}
                                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                disabled={numberConfigSaving.customer_invoice}
                              >
                                Reset Numbering
                              </button>
                              <div className="flex-1"></div>
                              <button
                                type="button"
                                onClick={() => handleDeleteNumberConfig('customer_invoice')}
                                className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-1"
                                disabled={numberConfigSaving.customer_invoice}
                                title="Delete configuration"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handleAccountDeletionSuccess}
        userType={role}
      />
    </div>
  );
};

export default Settings;