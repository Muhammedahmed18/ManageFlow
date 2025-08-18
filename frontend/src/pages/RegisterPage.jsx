import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendRegistrationOTP } from '../services/authService';
import { Factory, Users, ArrowRight, UserPlus, User, Mail, Lock, Home, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import colors from '../assets/colors';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'manufacturer'
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    general: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);

  const navigate = useNavigate();
  const { storeRegistrationEmail } = useAuth();

  // Password validation function
  const validatePassword = (password) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordValidation(validatePassword(formData.password));
      setShowPasswordValidation(true);
    } else {
      setShowPasswordValidation(false);
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear specific error when user types in that field
    if (errors[name] || errors.general) {
      setErrors({ ...errors, [name]: "", general: "" });
    }

    // Real-time email domain validation
    if (name === 'email' && value.trim()) {
      const emailDomain = value.split('@')[1]?.toLowerCase();
      if (emailDomain && !allowedEmailDomains.includes(emailDomain)) {
        setErrors({ ...errors, email: "Please use a supported email provider (Gmail, Outlook, Yahoo, etc.)" });
      }
    }
  };

  const handleRoleChange = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
    setErrors({ username: "", email: "", password: "", general: "", first_name: "", last_name: "" });
  };

  // Allowed email domains
  const allowedEmailDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.ca',
    'aol.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'protonmail.com',
    'tutanota.com',
    'zoho.com',
    'yandex.com',
    'mail.com',
    'live.com',
    'msn.com',
    'rocketmail.com',
    'gmx.com',
    'fastmail.com'
  ];

  const validateForm = () => {
    let isValid = true;
    const newErrors = { username: "", email: "", password: "", general: "", first_name: "", last_name: "" };

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
      isValid = false;
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    } else {
      // Check if email domain is allowed
      const emailDomain = formData.email.split('@')[1].toLowerCase();
      if (!allowedEmailDomains.includes(emailDomain)) {
        newErrors.email = "Please use a supported email provider (Gmail, Outlook, Yahoo, etc.)";
        isValid = false;
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else {
      // Check if all password requirements are met
      const validation = validatePassword(formData.password);
      const allValid = Object.values(validation).every(Boolean);
      if (!allValid) {
        newErrors.password = "Password does not meet all requirements";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ username: "", email: "", password: "", general: "", first_name: "", last_name: "" });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await sendRegistrationOTP(formData);
      storeRegistrationEmail(formData.email);
      navigate('/verify-otp');
    } catch (error) {
      let errorMsg = 'Failed to send registration OTP. Please try again.';
      const newErrors = { username: "", email: "", password: "", general: "", first_name: "", last_name: "" };
      
      if (error.response && error.response.data) {
        const data = error.response.data;
        
        if (typeof data === 'object') {
          Object.keys(data).forEach(field => {
            if (field === 'username') {
              newErrors.username = Array.isArray(data.username) ? data.username.join(' ') : data.username;
            } else if (field === 'email') {
              newErrors.email = Array.isArray(data.email) ? data.email.join(' ') : data.email;
            } else if (field === 'password') {
              newErrors.password = Array.isArray(data.password) ? data.password.join(' ') : data.password;
            } else if (field === 'first_name') {
              newErrors.first_name = Array.isArray(data.first_name) ? data.first_name.join(' ') : data.first_name;
            } else if (field === 'last_name') {
              newErrors.last_name = Array.isArray(data.last_name) ? data.last_name.join(' ') : data.last_name;
            } else {
              newErrors.general = typeof data[field] === 'object' ? Object.values(data[field]).flat().join(' ') : data[field];
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

  // Component for individual password requirement
  const PasswordRequirement = ({ isValid, text }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
        isValid ? 'text-green-600' : 'text-gray-500'
      }`}
    >
      {isValid ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-gray-400" />
      )}
      <span className={isValid ? 'line-through decoration-green-500' : ''}>{text}</span>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: colors.background }}>
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 p-2 rounded-full"
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
            The ultimate B2B marketplace connecting manufacturers with customers and providing comprehensive business management tools
          </motion.p>
        </div>
      </motion.div>

      {/* Right Panel - Registration Form */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Create Account
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: colors.textSecondary }}
            >
              Enter your personal data to create your account
            </motion.p>
          </div>

          {/* Role Selection */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
              I am a:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleRoleChange("manufacturer")}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center ${
                  formData.role === "manufacturer" 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ 
                  backgroundColor: formData.role === "manufacturer" ? colors.primary + '10' : colors.background,
                  borderColor: formData.role === "manufacturer" ? colors.primary : colors.border
                }}
              >
                <Factory className="w-5 h-5 mr-2" style={{ color: formData.role === "manufacturer" ? colors.primary : colors.textSecondary }} />
                <span className="font-medium" style={{ color: formData.role === "manufacturer" ? colors.primary : colors.textPrimary }}>
                  Manufacturer
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleRoleChange("customer")}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center ${
                  formData.role === "customer" 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ 
                  backgroundColor: formData.role === "customer" ? colors.primary + '10' : colors.background,
                  borderColor: formData.role === "customer" ? colors.primary : colors.border
                }}
              >
                <Users className="w-5 h-5 mr-2" style={{ color: formData.role === "customer" ? colors.primary : colors.textSecondary }} />
                <span className="font-medium" style={{ color: formData.role === "customer" ? colors.primary : colors.textPrimary }}>
                  Customer
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Error Display */}
          {errors.general && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg mb-4 text-sm bg-red-50 text-red-700 border border-red-200"
            >
              {errors.general}
            </motion.div>
          )}

          {/* Registration Form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* First Name and Last Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                    color: errors.first_name ? '#ef4444' : colors.textSecondary 
                  }} />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="eg. John"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                      errors.first_name 
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.textPrimary
                    }}
                  />
                </div>
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                    color: errors.last_name ? '#ef4444' : colors.textSecondary 
                  }} />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="eg. Francisco"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                      errors.last_name 
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.textPrimary
                    }}
                  />
                </div>
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: errors.username ? '#ef4444' : colors.textSecondary 
                }} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="eg. john_doe"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                    errors.username 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  style={{ 
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: errors.email ? '#ef4444' : colors.textSecondary 
                }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="eg. johnfrancis@gmail.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                    errors.email 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  style={{ 
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: errors.password ? '#ef4444' : colors.textSecondary 
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  style={{ 
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full p-1 transition-colors z-10"
                  style={{ 
                    color: colors.textSecondary,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px',
                    minHeight: '32px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Real-time Password Validation */}
              {showPasswordValidation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Password must contain:
                  </p>
                  <div className="space-y-1">
                    <PasswordRequirement 
                      isValid={passwordValidation.minLength}
                      text="At least 8 characters long"
                    />
                    <PasswordRequirement 
                      isValid={passwordValidation.hasUppercase}
                      text="At least 1 uppercase letter (A-Z)"
                    />
                    <PasswordRequirement 
                      isValid={passwordValidation.hasLowercase}
                      text="At least 1 lowercase letter (a-z)"
                    />
                    <PasswordRequirement 
                      isValid={passwordValidation.hasNumber}
                      text="At least 1 number (0-9)"
                    />
                    <PasswordRequirement 
                      isValid={passwordValidation.hasSpecialChar}
                      text="At least 1 special character (!@#$%^&* etc.)"
                    />
                  </div>
                  
                  {/* Password Strength Indicator */}
                  <div className="mt-3">
                    {(() => {
                      const validCount = Object.values(passwordValidation).filter(Boolean).length;
                      let strength = '';
                      let color = '';
                      
                      if (validCount === 0) {
                        strength = '';
                        color = '';
                      } else if (validCount <= 2) {
                        strength = 'Weak';
                        color = 'text-red-600';
                      } else if (validCount <= 4) {
                        strength = 'Medium';
                        color = 'text-yellow-600';
                      } else {
                        strength = 'Strong';
                        color = 'text-green-600';
                      }
                      
                      return strength ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((bar) => (
                              <div
                                key={bar}
                                className={`h-2 w-4 rounded-full ${
                                  bar <= validCount
                                    ? validCount <= 2
                                      ? 'bg-red-500'
                                      : validCount <= 4
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-xs font-medium ${color}`}>
                            Password strength: {strength}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>
              )}
              
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.primary }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Additional Links */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              Already have an account?{' '}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="font-medium hover:underline"
                style={{ color: colors.primary }}
              >
                Log in
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;