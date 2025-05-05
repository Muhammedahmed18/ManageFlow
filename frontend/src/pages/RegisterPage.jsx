import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/authService';
import { Factory, ShoppingCart, ArrowRight, UserPlus, User, Mail, Lock, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'manufacturer'
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { storeRegistrationEmail } = useAuth();

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
    error: '#DC2626',
    success: '#10B981'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear specific error when user types in that field
    if (errors[name] || errors.general) {
      setErrors({ ...errors, [name]: "", general: "" });
    }
  };

  const handleRoleChange = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
    setErrors({ username: "", email: "", password: "", general: "" });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { username: "", email: "", password: "", general: "" };

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ username: "", email: "", password: "", general: "" });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await registerUser(formData);
      storeRegistrationEmail(formData.email);
      navigate('/verify-otp');
    } catch (error) {
      let errorMsg = 'Registration failed. Please try again.';
      const newErrors = { username: "", email: "", password: "", general: "" };
      
      if (error.response && error.response.data) {
        const data = error.response.data;
        
        if (typeof data === 'object') {
          // Handle field-specific errors from server
          Object.keys(data).forEach(field => {
            if (field === 'username') {
              newErrors.username = data.username.join(' ');
            } else if (field === 'email') {
              newErrors.email = data.email.join(' ');
            } else if (field === 'password') {
              newErrors.password = data.password.join(' ');
            } else {
              newErrors.general = Object.values(data).flat().join(' ');
            }
          });
        } else if (typeof data === 'string') {
          newErrors.general = data;
        }
      } else if (error.message) {
        newErrors.general = error.message;
      } else {
        newErrors.general = errorMsg;
      }
      
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: colors.background }}>
      {/* Back to Landing Page Button */}
      <motion.button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 p-2 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.1 }}
        style={{ backgroundColor: colors.primary + '20' }}
      >
        <Home className="w-5 h-5" style={{ color: colors.white }} />
      </motion.button>

      {/* Left Panel - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center relative"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="text-center max-w-md">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            ManageFlow
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg md:text-xl"
          >
            Streamline your manufacturing and customer management in one powerful platform
          </motion.p>
        </div>
      </motion.div>

      {/* Right Panel - Registration Form */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border"
          style={{ borderColor: colors.border }}
        >
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl md:text-3xl font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Create Account
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: colors.textLight }}
            >
              Join ManageFlow to optimize your workflow
            </motion.p>
          </div>

          {/* Role Selector */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="flex bg-gray-100 rounded-xl p-1" style={{ borderColor: colors.border }}>
              <button
                type="button"
                onClick={() => handleRoleChange("manufacturer")}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${formData.role === "manufacturer" ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                style={{ 
                  backgroundColor: formData.role === "manufacturer" ? colors.white : 'transparent',
                  color: formData.role === "manufacturer" ? colors.primary : colors.textLight
                }}
              >
                <Factory className="mr-2" size={18} />
                Manufacturer
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("customer")}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${formData.role === "customer" ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                style={{ 
                  backgroundColor: formData.role === "customer" ? colors.white : 'transparent',
                  color: formData.role === "customer" ? colors.primary : colors.textLight
                }}
              >
                <ShoppingCart className="mr-2" size={18} />
                Customer
              </button>
            </div>
          </motion.div>

          {/* Registration Form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: errors.username ? colors.error : colors.textLighter 
                }} />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white rounded-lg border focus:ring-1 outline-none transition ${
                    errors.username 
                      ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-300' 
                      : 'border-gray-200 focus:ring-primary focus:border-primary'
                  }`}
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.white
                  }}
                />
              </div>
              {errors.username && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm flex items-center"
                  style={{ color: colors.error }}
                >
                  <span className="mr-1">✕</span>
                  {errors.username}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: errors.email ? colors.error : colors.textLighter 
                }} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white rounded-lg border focus:ring-1 outline-none transition ${
                    errors.email 
                      ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-300' 
                      : 'border-gray-200 focus:ring-primary focus:border-primary'
                  }`}
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.white
                  }}
                />
              </div>
              {errors.email && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm flex items-center"
                  style={{ color: colors.error }}
                >
                  <span className="mr-1">✕</span>
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: errors.password ? colors.error : colors.textLighter 
                }} />
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white rounded-lg border focus:ring-1 outline-none transition ${
                    errors.password 
                      ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-300' 
                      : 'border-gray-200 focus:ring-primary focus:border-primary'
                  }`}
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.white
                  }}
                />
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm flex items-center"
                  style={{ color: colors.error }}
                >
                  <span className="mr-1">✕</span>
                  {errors.password}
                </motion.p>
              )}
            </div>

            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-lg text-sm flex items-center bg-rose-50 border border-rose-100"
                style={{ color: colors.error }}
              >
                <span className="mr-2">✕</span>
                {errors.general}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center mt-6 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: colors.primary }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Register <ArrowRight className="ml-2" size={18} />
                </>
              )}
            </motion.button>

            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: colors.textLight }}>
                Already have an account?{' '}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-medium inline-flex items-center"
                  style={{ color: colors.primary }}
                >
                  <UserPlus className="mr-1" size={14} />
                  Sign in
                </motion.button>
              </p>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;