import React, { useState, useEffect } from "react";
import api from "../../services/authService";
import { FiUpload, FiFile, FiSettings, FiEdit2, FiX, FiFileText, FiPlus, FiEye, FiCheck, FiTrash2, FiHash, FiUser, FiShield, FiAlertTriangle } from "react-icons/fi";
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import AccountDeletionModal from '../shared/AccountDeletionModal';

const Settings = ({ businessId }) => {
  const { role, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [numberConfigs, setNumberConfigs] = useState({ 
    order: null
  });
  const [numberConfigLoading, setNumberConfigLoading] = useState(false);
  const [numberConfigForms, setNumberConfigForms] = useState({
    order: { start_number: '', prefix: '' }
  });
  const [numberConfigSaving, setNumberConfigSaving] = useState({ 
    order: false
  });
  const [activeNumberTab, setActiveNumberTab] = useState('order');
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    if (role === 'customer' && businessId) {
      setNumberConfigLoading(true);
      
      const fetchNumberConfigs = async () => {
        try {
          const response = await api.get(`/management/number-configs/?business=${businessId}&config_type=order`);
          
          const orderConfig = response.data && response.data.length > 0 ? response.data[0] : null;
          
          setNumberConfigs({
            order: orderConfig
          });
          
          // Set form values
          setNumberConfigForms({
            order: {
              start_number: orderConfig?.start_number || '',
              prefix: orderConfig?.prefix || ''
            }
          });
        } catch (error) {
          console.error('Error fetching number configs:', error);
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
      const response = await api.post('/management/number-configs/', {
        ...formData,
        business: businessId,
        config_type: configType
      });
      
      setNumberConfigs(prev => ({ ...prev, [configType]: response.data }));
      toast.success(`${configType.charAt(0).toUpperCase() + configType.slice(1)} numbering configuration saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${configType} config:`, error);
      if (error.response?.status === 400) {
        toast.error(error.response.data?.error || `Invalid ${configType} configuration`);
      } else {
        toast.error(`Failed to save ${configType} configuration`);
      }
    } finally {
      setNumberConfigSaving(prev => ({ ...prev, [configType]: false }));
    }
  };

  const handleResetNumbering = async (configType) => {
    if (!window.confirm(`Are you sure you want to reset the ${configType} numbering? This will reset the current number to the start number.`)) {
      return;
    }
    
    try {
      // For now, we'll just update the current number to match start number
      const currentConfig = numberConfigs[configType];
      if (currentConfig) {
        const response = await api.put(`/management/number-configs/${currentConfig.id}/`, {
          ...currentConfig,
          current_number: currentConfig.start_number
        });
        
        setNumberConfigs(prev => ({ ...prev, [configType]: response.data }));
        toast.success(`${configType.charAt(0).toUpperCase() + configType.slice(1)} numbering reset successfully!`);
      }
    } catch (error) {
      console.error(`Error resetting ${configType} numbering:`, error);
      toast.error(`Failed to reset ${configType} numbering`);
    }
  };

  const handleDeleteNumberConfig = async (configType) => {
    if (!window.confirm(`Are you sure you want to delete the ${configType} numbering configuration? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const currentConfig = numberConfigs[configType];
      if (currentConfig) {
        await api.delete(`/management/number-configs/${currentConfig.id}/`);
        
        setNumberConfigs(prev => ({ ...prev, [configType]: null }));
        setNumberConfigForms(prev => ({
          ...prev,
          [configType]: { start_number: '', prefix: '' }
        }));
        
        toast.success(`${configType.charAt(0).toUpperCase() + configType.slice(1)} numbering configuration deleted successfully!`);
      }
    } catch (error) {
      console.error(`Error deleting ${configType} config:`, error);
      toast.error(`Failed to delete ${configType} configuration`);
    }
  };

  const handleAccountDeletionSuccess = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column (Numbering & Forms) */}
          <div className="space-y-6">
            {/* Numbering Configuration */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                  <FiHash className="w-4 h-4" />
                </div>
                <h2 className="font-medium">Numbering Configuration</h2>
              </div>
              
              {numberConfigLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Loading configurations...</div>
              ) : (
                <div className="space-y-4">
                  {/* Order Numbering */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
                          <FiFileText className="w-3 h-3" />
                        </div>
                        <h3 className="text-sm font-medium">Order Numbering</h3>
                      </div>
                      {numberConfigs.order && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResetNumbering('order')}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleDeleteNumberConfig('order')}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {numberConfigs.order ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Current Number:</span>
                          <span className="font-medium">{numberConfigs.order.current_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Prefix:</span>
                          <span className="font-medium">{numberConfigs.order.prefix || 'None'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Start Number:</span>
                          <span className="font-medium">{numberConfigs.order.start_number}</span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleNumberConfigSave(e, 'order')} className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Start Number
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={numberConfigForms.order.start_number}
                            onChange={(e) => setNumberConfigForms(prev => ({
                              ...prev,
                              order: { ...prev.order, start_number: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Prefix (Optional)
                          </label>
                          <input
                            type="text"
                            value={numberConfigForms.order.prefix}
                            onChange={(e) => setNumberConfigForms(prev => ({
                              ...prev,
                              order: { ...prev.order, prefix: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ORD"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={numberConfigSaving.order}
                          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {numberConfigSaving.order ? 'Saving...' : 'Save Configuration'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column (Account Management) */}
          <div className="md:col-span-1 space-y-6">
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