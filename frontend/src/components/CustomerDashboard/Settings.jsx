import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, SettingsIcon, Mail, MapPin, Building, Save, 
  Eye, EyeOff, Lock, Trash2, Globe, Shield, AlertTriangle
} from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';
import BusinessLocationSetupModal from '../shared/BusinessLocationSetupModal';
import AccountDeletionModal from '../shared/AccountDeletionModal';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    description: '',
    location: ''
  });

  const [originalProfileForm, setOriginalProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    description: '',
    location: ''
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    business_visibility: 'public',
    contact_info_visibility: 'private',
    allow_contact_requests: true
  });

  const [businessSettings, setBusinessSettings] = useState({
    auto_approve_requests: false,
    require_approval: true,
    max_businesses: 5,
    default_visibility: 'public'
  });

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile/');
      const profileData = response.data;
      
      const profileDataObj = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        company_name: profileData.company_name || '',
        description: profileData.description || '',
        location: profileData.location || ''
      };
      
      setProfileForm(profileDataObj);
      setOriginalProfileForm(profileDataObj);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      // Fetch privacy settings
      const privacyResponse = await api.get('/auth/settings/privacy/');
      setPrivacySettings(privacyResponse.data);
      
      // Fetch business settings
      const businessResponse = await api.get('/auth/settings/business/');
      setBusinessSettings(businessResponse.data);
      
      console.log('Settings fetched successfully');
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if API fails
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchSettings();
  }, []);

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      await api.put('/auth/profile/', profileForm);
      console.log('Profile updated successfully');
      setOriginalProfileForm(profileForm);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setProfileForm(originalProfileForm);
    setIsEditing(false);
  };

  const handlePrivacySave = async () => {
    try {
      setSaving(true);
      await api.put('/auth/settings/privacy/', privacySettings);
      console.log('Privacy settings updated successfully');
      toast.success('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeletionSuccess = () => {
    // Redirect to login page after successful account deletion
    window.location.href = '/login';
  };

  const handleBusinessSave = async () => {
    try {
      setSaving(true);
      await api.put('/auth/settings/business/', businessSettings);
      console.log('Business settings updated successfully');
      toast.success('Business settings updated successfully!');
    } catch (error) {
      console.error('Error updating business settings:', error);
      toast.error('Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'account', label: 'Account', icon: Trash2 }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage your account preferences and settings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     First Name
                   </label>
                   <input
                     type="text"
                     value={profileForm.first_name}
                     disabled={!isEditing}
                     onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                     className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                       isEditing 
                         ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                         : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                     }`}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Last Name
                   </label>
                   <input
                     type="text"
                     value={profileForm.last_name}
                     disabled={!isEditing}
                     onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                     className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                       isEditing 
                         ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                         : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                     }`}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Email
                   </label>
                   <input
                     type="email"
                     value={profileForm.email}
                     disabled={!isEditing}
                     onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                     className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                       isEditing 
                         ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                         : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                     }`}
                   />
                 </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.company_name}
                    disabled={!isEditing}
                    onChange={(e) => setProfileForm({...profileForm, company_name: e.target.value})}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing 
                        ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={profileForm.description}
                    disabled={!isEditing}
                    onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                    rows="3"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing 
                        ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                        : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>
                                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Location
                   </label>
                   <div className="flex space-x-2">
                     <input
                       type="text"
                       value={profileForm.location}
                       readOnly
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                       placeholder="Click the location button to set location"
                     />
                     <button
                       onClick={() => setShowLocationModal(true)}
                       disabled={!isEditing}
                       className={`px-4 py-2 rounded-lg transition-colors ${
                         isEditing 
                           ? 'bg-blue-600 text-white hover:bg-blue-700' 
                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                       }`}
                     >
                       <MapPin className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
              </div>
              <div className="flex justify-end mt-6">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleProfileSave}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'account' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Account Management */}
            <div>
              {/* Delete Account Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-6 shadow-sm border border-gray-200 bg-white"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl bg-red-100">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Account Management
                  </h2>
                </div>

                <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                  <div className="text-center">
                    <div className="p-3 rounded-full mx-auto mb-3 bg-red-100 w-fit">
                      <Trash2 size={20} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-medium mb-2 text-red-900">
                      Delete Account
                    </h3>
                    <p className="text-xs mb-4 text-red-700">
                      This action cannot be undone. All your data will be permanently removed.
                    </p>
                    <button
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="px-4 py-2 rounded-xl transition-all bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={privacySettings.profile_visibility}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings,
                      profile_visibility: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="contacts">Contacts Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Visibility
                  </label>
                  <select
                    value={privacySettings.business_visibility}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings,
                      business_visibility: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="contacts">Contacts Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information Visibility
                  </label>
                  <select
                    value={privacySettings.contact_info_visibility}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings,
                      contact_info_visibility: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="contacts">Contacts Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Allow Contact Requests</h3>
                    <p className="text-sm text-gray-500">Let manufacturers send you contact requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.allow_contact_requests}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        allow_contact_requests: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handlePrivacySave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'business' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold mb-4">Business Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Auto-approve Contact Requests</h3>
                    <p className="text-sm text-gray-500">Automatically approve incoming contact requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={businessSettings.auto_approve_requests}
                      onChange={(e) => setBusinessSettings({
                        ...businessSettings,
                        auto_approve_requests: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">Require Manual Approval</h3>
                    <p className="text-sm text-gray-500">Manually review and approve contact requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={businessSettings.require_approval}
                      onChange={(e) => setBusinessSettings({
                        ...businessSettings,
                        require_approval: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Businesses
                  </label>
                  <select
                    value={businessSettings.max_businesses}
                    onChange={(e) => setBusinessSettings({
                      ...businessSettings,
                      max_businesses: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={3}>3 Businesses</option>
                    <option value={5}>5 Businesses</option>
                    <option value={10}>10 Businesses</option>
                    <option value={20}>20 Businesses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Business Visibility
                  </label>
                  <select
                    value={businessSettings.default_visibility}
                    onChange={(e) => setBusinessSettings({
                      ...businessSettings,
                      default_visibility: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleBusinessSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Business Location Setup Modal */}
      <BusinessLocationSetupModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={(location) => {
          setProfileForm({...profileForm, location});
          setShowLocationModal(false);
        }}
        currentLocation={profileForm.location}
      />

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handleAccountDeletionSuccess}
        userType="customer"
      />
    </div>
  );
};

export default Settings;
