import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/authService';
import { colors } from '../../constants/theme';

const JoinBusinessModal = ({ isOpen, onClose, customerName, businessName, businessInfo, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Please enter the invite code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/management/manufacturer/join-business/', {
        invite_code: inviteCode.trim()
      });

      setSuccess(true);
      setError('');
      
      // Show success message for 2 seconds then close
      setTimeout(() => {
        onSuccess && onSuccess(response.data);
        onClose();
        setSuccess(false);
        setInviteCode('');
      }, 2000);

    } catch (err) {
      console.error('Error joining business:', err);
      setError(err.response?.data?.error || 'Failed to join business. Please check the invite code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setInviteCode('');
      setError('');
      setSuccess(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Building size={20} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      Join Business
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Enter invite code to join
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                {businessInfo ? (
                  <div>
                    <h4 className="font-medium text-sm mb-2" style={{ color: colors.textPrimary }}>
                      Business Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p style={{ color: colors.textSecondary }}>
                        <strong>Business:</strong> {businessInfo.businessName}
                      </p>
                      <p style={{ color: colors.textSecondary }}>
                        <strong>Contact:</strong> {businessInfo.customerName}
                      </p>
                      <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: colors.success + '10', color: colors.success }}>
                        Contact {businessInfo.customerName} to get the invite code for {businessInfo.businessName}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {customerName}
                    </p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {businessName}
                    </p>
                  </>
                )}
              </div>

              {/* Success State */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg flex items-center space-x-3"
                  style={{ backgroundColor: `${colors.success}10` }}
                >
                  <CheckCircle size={20} style={{ color: colors.success }} />
                  <div>
                    <p className="font-medium" style={{ color: colors.success }}>
                      Successfully joined business!
                    </p>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      You can now manage this business from your dashboard.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg flex items-center space-x-3"
                  style={{ backgroundColor: `${colors.error}10` }}
                >
                  <AlertCircle size={20} style={{ color: colors.error }} />
                  <p className="text-sm" style={{ color: colors.error }}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Form */}
              {!success && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Business Invite Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={16} style={{ color: colors.textSecondary }} />
                      </div>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter the invite code provided by the customer"
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.cardBg,
                          color: colors.textPrimary
                        }}
                        disabled={loading}
                      />
                    </div>
                    <p className="mt-2 text-xs" style={{ color: colors.textSecondary }}>
                      Ask the customer for their business invite code to join their business.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 py-2 px-4 rounded-lg border transition-colors disabled:opacity-50"
                      style={{ 
                        borderColor: colors.border, 
                        color: colors.textSecondary 
                      }}
                    >
                      Cancel
                    </button>
                                         <button
                       type="submit"
                       disabled={loading || !inviteCode.trim()}
                       className="flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-white"
                       style={{ 
                         backgroundColor: colors.primary
                       }}
                     >
                       {loading ? (
                         <>
                           <Loader2 size={16} className="animate-spin text-white" />
                           <span className="text-white">Joining...</span>
                         </>
                       ) : (
                         <span className="text-white">Join Business</span>
                       )}
                     </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JoinBusinessModal;
