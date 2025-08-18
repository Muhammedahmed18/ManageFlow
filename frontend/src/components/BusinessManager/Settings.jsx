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
    manufacturer_invoice: null,
    customer_invoice: null
  });
  const [numberConfigLoading, setNumberConfigLoading] = useState(false);
  const [numberConfigForms, setNumberConfigForms] = useState({
    manufacturer_invoice: { start_number: '', prefix: '' },
    customer_invoice: { start_number: '', prefix: '' }
  });
  const [numberConfigSaving, setNumberConfigSaving] = useState({ 
    manufacturer_invoice: false,
    customer_invoice: false
  });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Number config for both manufacturers and customers
  useEffect(() => {
    if (businessId) {
      setNumberConfigLoading(true);
      
      const fetchConfigs = async () => {
        try {
          const configs = {};
          const forms = {};
          
          // Determine which config types to fetch based on role
          const configTypes = role === 'manufacturer' 
            ? ['manufacturer_invoice'] 
            : ['customer_invoice'];
          
          for (const configType of configTypes) {
            const response = await api.get(`/management/number-configs/?business=${businessId}&config_type=${configType}`);
            
            let config = null;
            if (response.data.results) {
              // Paginated response
              config = response.data.results[0] || null;
            } else if (Array.isArray(response.data)) {
              // Array response
              config = response.data[0] || null;
            } else {
              // Single object response
              config = response.data || null;
            }
            
            configs[configType] = config;
            forms[configType] = {
              start_number: config?.start_number?.toString() || '',
              prefix: config?.prefix || ''
            };
          }
          
          setNumberConfigs(configs);
          setNumberConfigForms(forms);
        } catch (err) {
          console.error("Number config error:", err);
          toast.error("Failed to load number configuration");
        } finally {
          setNumberConfigLoading(false);
        }
      };
      
      fetchConfigs();
    }
  }, [role, businessId]);

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

      // Refresh the configs
      const res = await api.get(`/management/number-configs/?business=${businessId}&config_type=${configType}`);
      let newConfig = null;
      
      if (res.data.results) {
        newConfig = res.data.results[0] || null;
      } else if (Array.isArray(res.data)) {
        newConfig = res.data[0] || null;
      } else {
        newConfig = res.data || null;
      }
      
      setNumberConfigs(prev => ({ ...prev, [configType]: newConfig }));
      
    } catch (err) {
      console.error("Save number config error:", err);
      toast.error("Failed to save number configuration");
    } finally {
      setNumberConfigSaving(prev => ({ ...prev, [configType]: false }));
    }
  };

  const handleResetNumbering = async (configType) => {
    if (!numberConfigs[configType]) return;
    
    setNumberConfigSaving(prev => ({ ...prev, [configType]: true }));
    
    try {
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
      console.error("Reset numbering error:", err);
      toast.error("Failed to reset numbering");
    } finally {
      setNumberConfigSaving(prev => ({ ...prev, [configType]: false }));
    }
  };

  const handleAccountDeletionSuccess = () => {
    // Logout user after successful account deletion
    logout(true); // Skip API call since account is already deleted
  };

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
          {(role === 'manufacturer' || role === 'customer') && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                  <FiHash className="w-4 h-4" />
                </div>
                <h2 className="font-medium">Number Configuration</h2>
              </div>
              
              {numberConfigLoading ? (
                <div className="py-2 text-center text-sm text-gray-500">Loading configuration...</div>
              ) : (
                <div className="space-y-4">
                  {/* Invoice Numbering */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      {role === 'manufacturer' ? 'Manufacturer Invoice Numbering' : 'Customer Invoice Numbering'}
                    </h3>
                    <form onSubmit={(e) => handleNumberConfigSave(e, role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice')} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Number</label>
                          <input
                            type="number"
                            name="start_number"
                            value={numberConfigForms[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'].start_number}
                            onChange={(e) => setNumberConfigForms(prev => ({
                              ...prev,
                              [role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice']: { 
                                ...prev[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'], 
                                start_number: e.target.value 
                              }
                            }))}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'] ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            min={1}
                            required
                            disabled={numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice']}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
                          <input
                            type="text"
                            name="prefix"
                            value={numberConfigForms[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'].prefix}
                            onChange={(e) => setNumberConfigForms(prev => ({
                              ...prev,
                              [role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice']: { 
                                ...prev[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'], 
                                prefix: e.target.value 
                              }
                            }))}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'] ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            maxLength={10}
                            placeholder={role === 'manufacturer' ? "MFG-INV-" : "CUST-INV-"}
                            disabled={numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice']}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {!numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'] && (
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={numberConfigSaving[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice']}
                            >
                              {numberConfigSaving[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'] ? 'Saving...' : 'Save Format'}
                            </button>
                          )}
                          {numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'] && (
                            <button
                              type="button"
                              onClick={() => handleResetNumbering(role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice')}
                              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                              disabled={numberConfigSaving[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice']}
                            >
                              Reset Numbering
                            </button>
                          )}
                        </div>
                        {numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'] && (
                          <div className="text-sm text-gray-600">
                            Current: <span className="font-medium">
                              {numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'].prefix 
                                ? `${numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'].prefix}-${numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'].current_number}` 
                                : numberConfigs[role === 'manufacturer' ? 'manufacturer_invoice' : 'customer_invoice'].current_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default Settings; 