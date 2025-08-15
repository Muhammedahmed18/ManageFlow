import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings as SettingsIcon, MapPin, Building, Mail, 
  AlertTriangle, X, Save, Edit3, Trash2
} from 'lucide-react';
import api from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import AccountDeletionModal from '../shared/AccountDeletionModal';
import LocationSetupModal from '../shared/LocationSetupModal';

const Settings = () => {
  const { getRole, logout } = useAuth();
  const role = getRole();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent mx-auto mb-4 border-blue-500" />
          <p className="text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white min-h-screen">
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
              Manage your profile information
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 shadow-sm border border-gray-200 bg-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <User size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Information
              </h2>
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

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-gray-500 uppercase tracking-wider">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.first_name}
                      onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.last_name}
                      onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-gray-500 uppercase tracking-wider">
                Business Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 text-left flex items-center justify-between hover:bg-gray-50 disabled:hover:bg-gray-100"
                  >
                    <span className={profile.location ? 'text-gray-900' : 'text-gray-500'}>
                      {profile.location || 'Click to set location'}
                    </span>
                    <MapPin size={16} className="text-gray-400" />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={profile.description}
                    onChange={(e) => setProfile({...profile, description: e.target.value})}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-xl transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md"
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
          </div>
        </motion.div>


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