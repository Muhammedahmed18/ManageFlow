import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { FiHash, FiTrash2, FiUser, FiShield, FiAlertTriangle } from "react-icons/fi";
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AccountDeletionModal from '../shared/AccountDeletionModal';

const Settings = ({ businessId }) => {
  const { role, logout } = useAuth();
  const [numberConfigs, setNumberConfigs] = useState({ 
    manufacturer_invoice: null 
  });
  const [numberConfigLoading, setNumberConfigLoading] = useState(false);
  const [numberConfigForms, setNumberConfigForms] = useState({
    manufacturer_invoice: { start_number: '', prefix: '' }
  });
  const [numberConfigSaving, setNumberConfigSaving] = useState({ 
    manufacturer_invoice: false 
  });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Number config for manufacturers
  useEffect(() => {
    if (role === 'manufacturer' && businessId) {
      setNumberConfigLoading(true);
      
      // Fetch manufacturer invoice number config
      api.get(`/management/number-configs/?business=${businessId}&config_type=manufacturer_invoice`)
        .then((manufacturerInvoiceRes) => {
          // Handle both paginated and non-paginated responses
          let manufacturerInvoiceConfig = null;
          
          if (manufacturerInvoiceRes.data.results) {
            // Paginated response
            manufacturerInvoiceConfig = manufacturerInvoiceRes.data.results[0] || null;
          } else if (Array.isArray(manufacturerInvoiceRes.data)) {
            // Array response
            manufacturerInvoiceConfig = manufacturerInvoiceRes.data[0] || null;
          } else {
            // Single object response
            manufacturerInvoiceConfig = manufacturerInvoiceRes.data || null;
          }
          
          setNumberConfigs({ 
            manufacturer_invoice: manufacturerInvoiceConfig 
          });
          
          setNumberConfigForms({
            manufacturer_invoice: {
              start_number: manufacturerInvoiceConfig?.start_number?.toString() || '',
              prefix: manufacturerInvoiceConfig?.prefix || ''
            }
          });
        })
        .catch(err => {
          console.error("Number config error:", err);
          toast.error("Failed to load number configuration");
        })
        .finally(() => setNumberConfigLoading(false));
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
        // Update existing config
        await api.put(`/management/number-configs/${numberConfigs[configType].id}/`, payload);
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
    logout();
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
          {role === 'manufacturer' && (
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
                  {/* Manufacturer Invoice Numbering */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Manufacturer Invoice Numbering</h3>
                    <form onSubmit={(e) => handleNumberConfigSave(e, 'manufacturer_invoice')} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Number</label>
                          <input
                            type="number"
                            name="start_number"
                            value={numberConfigForms.manufacturer_invoice.start_number}
                            onChange={(e) => setNumberConfigForms(prev => ({
                              ...prev,
                              manufacturer_invoice: { ...prev.manufacturer_invoice, start_number: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs.manufacturer_invoice ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            min={1}
                            required
                            disabled={numberConfigs.manufacturer_invoice}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
                          <input
                            type="text"
                            name="prefix"
                            value={numberConfigForms.manufacturer_invoice.prefix}
                            onChange={(e) => setNumberConfigForms(prev => ({
                              ...prev,
                              manufacturer_invoice: { ...prev.manufacturer_invoice, prefix: e.target.value }
                            }))}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${numberConfigs.manufacturer_invoice ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            maxLength={10}
                            placeholder="MFG-INV-"
                            disabled={numberConfigs.manufacturer_invoice}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {!numberConfigs.manufacturer_invoice && (
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              disabled={numberConfigSaving.manufacturer_invoice}
                            >
                              {numberConfigSaving.manufacturer_invoice ? 'Saving...' : 'Save Format'}
                            </button>
                          )}
                          {numberConfigs.manufacturer_invoice && (
                            <button
                              type="button"
                              onClick={() => handleResetNumbering('manufacturer_invoice')}
                              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                              disabled={numberConfigSaving.manufacturer_invoice}
                            >
                              Reset Numbering
                            </button>
                          )}
                        </div>
                        {numberConfigs.manufacturer_invoice && (
                          <div className="text-sm text-gray-600">
                            Current: <span className="font-medium">{numberConfigs.manufacturer_invoice.prefix ? `${numberConfigs.manufacturer_invoice.prefix}-${numberConfigs.manufacturer_invoice.current_number}` : numberConfigs.manufacturer_invoice.current_number}</span>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Management */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-red-50 text-red-600">
                <FiUser className="w-4 h-4" />
              </div>
              <h2 className="font-medium">Account Management</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Account Security</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Manage your account settings and security preferences
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Account Status</span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">User Type</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                      {role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium mb-2 text-red-700">Danger Zone</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Irreversible and destructive actions
                </p>
                
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="w-full px-4 py-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
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