import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Lock, Eye, EyeOff, X } from 'lucide-react';
import api from '../../services/authService';
import { toast } from 'react-toastify';

const AccountDeletionModal = ({ isOpen, onClose, onSuccess, userType = 'user' }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState(1); // 1: password input, 2: final confirmation
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsDeleting(true);
    setError(''); // Clear previous errors
    
    try {
      // Verify password by attempting to authenticate
      const response = await api.post('/auth/verify-password/', { password });
      
      if (response.data.valid) {
        setStep(2); // Move to final confirmation
      } else {
        // Show the specific error message from the backend
        const errorMessage = response.data.error || 'Incorrect password. Please try again.';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Password verification error:', error);
      // Handle network errors or other unexpected errors
      setError('Failed to verify password. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Delete account
      await api.delete('/auth/delete-account/', { 
        data: { password } // Send password again for final verification
      });
      
      // Show success toast and redirect
      toast.success('Account deleted successfully');
      handleClose();
      // Small delay to ensure toast is visible before redirect
      setTimeout(() => {
        onSuccess(); // This will trigger the redirect to login page
      }, 1000);
    } catch (error) {
      console.error('Account deletion error:', error);
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Incorrect password or account deletion failed';
        setError(errorMessage);
      } else if (error.response?.status === 403) {
        setError('You are not authorized to delete this account');
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setStep(1);
    setIsDeleting(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 ? 'Delete Account' : 'Final Confirmation'}
              </h2>
              <p className="text-sm text-gray-600">
                {step === 1 ? 'This action requires password verification' : 'This action cannot be undone'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Warning: Account Deletion
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Deleting your account will permanently remove all your data, including:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      {userType === 'customer' ? (
                        <>
                          <li>• All business profiles and information</li>
                          <li>• Contact requests and manufacturer connections</li>
                          <li>• Order history and invoices</li>
                          <li>• Account settings and preferences</li>
                        </>
                      ) : (
                        <>
                          <li>• All business information</li>
                          <li>• Product data and templates</li>
                          <li>• Order history and invoices</li>
                          <li>• Customer relationships</li>
                          <li>• Account settings and preferences</li>
                        </>
                      )}
                    </ul>
                    <p className="text-sm font-medium text-red-800 mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password to continue
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || !password.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? 'Verifying...' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Final Warning
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      You are about to permanently delete your account. All data will be lost and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccountDeletionModal; 