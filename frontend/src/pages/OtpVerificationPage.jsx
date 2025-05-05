import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyOTP, forgotPassword } from '../services/authService';
import { ArrowRight, Mail, LockKeyhole, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

const OtpVerificationPage = () => {
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

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  
  const inputRefs = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  
  const { getRegistrationEmail, clearRegistrationEmail } = useAuth();
  
  useEffect(() => {
    // Get stored email
    const storedEmail = getRegistrationEmail();
    
    // Check if we're here from registration or password reset
    const pathParams = new URLSearchParams(window.location.search);
    const resetParam = pathParams.get('reset');
    
    if (resetParam === 'true') {
      setIsPasswordReset(true);
      // For password reset, email might be in URL params
      const emailParam = pathParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    } else if (!storedEmail) {
      // If no email and not password reset, redirect to registration
      navigate('/register');
      return;
    } else {
      setEmail(storedEmail);
    }
    
    // Start countdown
    startCountdown();
    
    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  const startCountdown = () => {
    setCountdown(60);
    setResendEnabled(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setResendEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value !== '' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Call API to resend OTP
      if (isPasswordReset) {
        await forgotPassword(email);
      } else {
        // For registration OTP resend, you might need a different endpoint
        await forgotPassword(email);
      }
      
      // Show success toast for OTP resend
      toast.success('New OTP has been sent to your email!', {
        position: 'top-center',
        style: {
          background: colors.primary,
          color: colors.white,
        },
        duration: 3000,
      });
      
      // Reset countdown
      startCountdown();
      
      // Clear input fields
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (error) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const enteredOTP = otp.join('');
    
    try {
      // Verify OTP with backend
      await verifyOTP(email, enteredOTP);
      
      // Show success toast
      toast.success(
        isPasswordReset 
          ? 'OTP verified! You can now reset your password.' 
          : 'Account verified successfully! Redirecting to login...',
        {
          position: 'top-center',
          style: {
            background: colors.primary,
            color: colors.white,
          },
          duration: 3000,
        }
      );
      
      // Clear registration email if from registration
      if (!isPasswordReset) {
        clearRegistrationEmail();
        
        // Navigate to login page after toast is shown
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // If from password reset, navigate to reset password form after toast
        setTimeout(() => {
          navigate(`/reset-password?email=${email}&otp=${enteredOTP}`);
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'Invalid OTP. Please try again.');
      
      // Clear input fields
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6" style={{ backgroundColor: colors.background }}>
      

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
            OTP Verification
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: colors.textLight }}
          >
            {isPasswordReset 
              ? 'Enter the 6-digit code sent to your email to reset your password'
              : 'Enter the 6-digit code sent to your email to complete registration'}
          </motion.p>
        </div>

        {/* Centered Email Display */}
        <div className="flex justify-center mb-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center bg-gray-100 rounded-lg p-3 max-w-xs"
            style={{ color: colors.textLight }}
          >
            <Mail className="mr-2" size={18} style={{ color: colors.primary }} />
            <span className="truncate">{email}</span>
          </motion.div>
        </div>

        {/* Error Message */}
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

        {/* OTP Form */}
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                className="w-12 h-12 text-center text-xl border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                style={{ 
                  borderColor: colors.border,
                  color: colors.text
                }}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                maxLength={1}
                required
                whileFocus={{ scale: 1.05 }}
              />
            ))}
          </div>

          <div className="text-center">
            {resendEnabled ? (
              <motion.button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm flex items-center justify-center w-full"
                style={{ color: colors.primary }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LockKeyhole className="mr-1" size={14} style={{ color: colors.primary }} />
                Resend OTP
              </motion.button>
            ) : (
              <p className="text-sm" style={{ color: colors.textLight }}>
                Resend OTP in {countdown} seconds
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading || otp.some(digit => digit === '')}
            className={`w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center ${
              (loading || otp.some(digit => digit === '')) ? 'opacity-70' : ''
            }`}
            style={{ backgroundColor: colors.primary }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify OTP <ArrowRight className="ml-2" size={18} />
              </>
            )}
          </motion.button>
        </motion.form>
      </motion.div>

      {/* Toast Container */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: colors.primary,
            color: colors.white,
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            duration: 3000,
          },
          error: {
            style: {
              background: '#ef4444',
              color: colors.white,
            },
            iconTheme: {
              primary: colors.white,
              secondary: '#ef4444',
            },
          }
        }}
      />
    </div>
  );
};

export default OtpVerificationPage;