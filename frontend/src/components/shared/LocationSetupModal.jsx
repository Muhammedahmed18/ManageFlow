import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check } from 'lucide-react';
import { colors } from '../../constants/theme';
import api from '../../services/authService';

const LocationSetupModal = ({ isOpen, onClose, onLocationSet }) => {
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common locations for quick selection
  const commonLocations = [
    'Pakistan', 'India', 'China', 'Bangladesh', 'Vietnam',
    'United States', 'United Kingdom', 'Germany', 'France', 'Italy',
    'Turkey', 'Mexico', 'Brazil', 'Canada', 'Australia'
  ];

  useEffect(() => {
    if (isOpen) {
      // Fetch current user location if exists
      fetchCurrentLocation();
    }
  }, [isOpen]);

  const fetchCurrentLocation = async () => {
    try {
      const response = await api.get('/auth/profile/');
      if (response.data.location) {
        setLocation(response.data.location);
      }
    } catch (error) {
      console.error('Failed to fetch current location:', error);
    }
  };

  const handleSubmit = async () => {
    if (!location.trim()) {
      setError('Please enter your location');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Updating location:', location.trim());
      // Use the main profile update endpoint instead of the specific location endpoint
      const response = await api.put('/auth/profile/', {
        location: location.trim()
      });
      console.log('Location update response:', response.data);

      onLocationSet(location.trim());
      onClose();
    } catch (error) {
      console.error('Location update error:', error);
      setError(error.response?.data?.error || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl shadow-2xl"
          style={{ backgroundColor: colors.cardBg }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b"
               style={{ borderColor: colors.border }}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: colors.primary + '20' }}>
                <MapPin size={20} style={{ color: colors.primary }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                  Set Your Location
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  This will be used for all contact requests
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: colors.textSecondary }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
                Your Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setError('');
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="e.g., Pakistan, United States, China..."
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.textPrimary
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.accent;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.accent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Quick Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
                Quick Select
              </label>
              <div className="grid grid-cols-3 gap-2">
                {commonLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleQuickSelect(loc)}
                    className={`p-2 text-sm rounded-lg border transition-all ${
                      location === loc 
                        ? 'border-transparent' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: location === loc ? colors.primary : 'transparent',
                      borderColor: location === loc ? colors.primary : colors.border,
                      color: location === loc ? colors.white : colors.textPrimary
                    }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div 
                className="p-3 border rounded-lg mb-4"
                style={{ 
                  backgroundColor: `${colors.error}10`,
                  borderColor: colors.error
                }}
              >
                <p className="text-sm" style={{ color: colors.error }}>
                  {error}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border rounded-lg transition-colors font-medium"
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = colors.background}
                onMouseLeave={(e) => e.target.style.backgroundColor = colors.cardBg}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !location.trim()}
                className="flex-1 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                style={{ backgroundColor: colors.accent }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = colors.accent;
                  }
                }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Check size={16} />
                    <span>Save Location</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationSetupModal;
