import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings as SettingsIcon, MapPin, Building, Mail, 
  AlertTriangle, X, Save, Edit3, Trash2, Shield, Globe, Lock
} from 'lucide-react';
import api from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import AccountDeletionModal from '../shared/AccountDeletionModal';
import LocationSetupModal from '../shared/LocationSetupModal';
import { colors } from '../../constants/theme';

const Settings = () => {
  const { getRole, logout } = useAuth();
  const role = getRole();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    location: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [error, setError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);



  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile/');
      setProfile({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        company_name: response.data.company_name || '',
        location: response.data.location || '',
        description: response.data.description || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      
      await api.put('/auth/profile/', profile);
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    fetchProfile();
    setError('');
  };

  const handleAccountDeletionSuccess = () => {
    logout(true); // Skip API call since account is already deleted
  };

  const handleLocationSet = (newLocation) => {
    setProfile({ ...profile, location: newLocation });
    showToast('Location updated successfully!', 'success');
  };



  const showToast = (message, type = 'success') => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Trash2 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent mx-auto mb-4 border-blue-500" />
          <p className="text-gray-700">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 rounded-xl bg-blue-500 shadow-md">
            <SettingsIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Account Settings
            </h1>
            <p className="text-lg mt-1 text-gray-600">
              Manage your profile and account settings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-600 mt-1">Update your personal and business details</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    <Edit3 size={16} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium"
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">First Name</label>
                        <input
                          type="text"
                          value={profile.first_name}
                          disabled={true}
                          className="w-full px-4 py-3 border rounded-xl transition-all border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Last Name</label>
                        <input
                          type="text"
                          value={profile.last_name}
                          disabled={true}
                          className="w-full px-4 py-3 border rounded-xl transition-all border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled={true}
                        className="w-full px-4 py-3 border rounded-xl transition-all border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Company Name</label>
                      <input
                        type="text"
                        value={profile.company_name}
                        onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Location</label>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 text-left flex items-center justify-between hover:bg-gray-50 disabled:hover:bg-gray-50"
                      >
                        <span className={profile.location ? 'text-gray-900' : 'text-gray-500'}>
                          {profile.location || 'Click to set location'}
                        </span>
                        <MapPin size={16} className="text-gray-400" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Business Description</label>
                      <textarea
                        value={profile.description}
                        onChange={(e) => setProfile({...profile, description: e.target.value})}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full px-4 py-3 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                        placeholder="Describe your business and manufacturing capabilities..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl transition-all bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          )}



          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Account Actions</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your account settings and data</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-xl bg-red-50 border border-red-200">
                  <div>
                    <h3 className="font-medium text-red-900">Delete Account</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-800">
              {error}
            </span>
          </div>
        </motion.div>
      )}

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handleAccountDeletionSuccess}
      />

      {/* Location Setup Modal */}
      <LocationSetupModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={handleLocationSet}
      />
    </div>
  );
};

export default Settings;