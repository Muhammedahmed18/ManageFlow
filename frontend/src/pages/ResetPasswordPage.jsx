import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { Lock, Key, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Using the same color scheme from landing page
  const colors = {
    primary: '#1C2E4A',
    primaryLight: '#3A4D6B',
    secondary: '#52677D',
    accent: '#D1CFC9',
    background: '#FFFFFF',
    cardBg: '#F8F9FA',
    text: '#1C2E4A',
    textLight: '#52677D',
    textLighter: '#8A9CB0',
    border: '#E0E4E9',
    white: '#FFFFFF',
  };
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp');
    
    if (!emailParam || !otpParam) {
      navigate('/forgot-password');
      return;
    }
    
    setEmail(emailParam);
    setOtp(otpParam);
    
    // Clear any existing toasts when the component mounts
    toast.dismiss();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully! Redirecting to login...', {
        duration: 2500,
        position: 'top-center',
        style: {
          background: colors.primary,
          color: colors.white,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
        },
        iconTheme: {
          primary: colors.white,
          secondary: colors.primary,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 2500));
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Failed to reset password. Please try again.');
      toast.error(error.message || 'Failed to reset password', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#ef4444', // Keeping red for errors
          color: colors.white,
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
        },
        iconTheme: {
          primary: colors.white,
          secondary: '#ef4444',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6" style={{ backgroundColor: colors.background }}>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: colors.primary,
              color: colors.white,
            },
            iconTheme: {
              primary: colors.white,
              secondary: colors.primary,
            },
          },
          error: {
            style: {
              background: '#ef4444', // Keeping red for errors
              color: colors.white,
            },
            iconTheme: {
              primary: colors.white,
              secondary: '#ef4444',
            },
          },
        }}
      />
      
      

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8"
        style={{ borderColor: colors.border }}
      >
        <div className="text-center mb-8">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-semibold mb-2"
            style={{ color: colors.primary }}
          >
            Reset Your Password
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: colors.textLight }}
          >
            Create a new secure password
          </motion.p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 px-4 py-3 rounded-lg mb-6 text-sm"
            style={{ color: '#dc2626', border: '1px solid #fecaca' }}
          >
            {error}
          </motion.div>
        )}

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: colors.textLighter }} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength="8"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                style={{ 
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Confirm Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: colors.textLighter }} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength="8"
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                style={{ 
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : 'Reset Password'}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;