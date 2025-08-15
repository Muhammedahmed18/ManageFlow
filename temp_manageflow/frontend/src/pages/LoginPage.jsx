import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { Lock, User, Factory, ShoppingCart, ArrowRight, Key, UserPlus, Home } from "lucide-react";
import { motion } from "framer-motion";
import colors from '../assets/colors';

const LoginPage = () => {
  const [role, setRole] = useState("manufacturer");
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { updateCurrentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    business_id: ""
  });
  const [error, setError] = useState({
    message: "",
    type: "" // can be 'username', 'password', 'account', or 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const message = localStorage.getItem("loginRedirectMessage");
    if (message) {
      alert(message);
      localStorage.removeItem("loginRedirectMessage");
    }

    const lastEmail = localStorage.getItem("lastEmail");
    if (lastEmail) {
      setFormData((prev) => ({ ...prev, username: lastEmail }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error.message) {
      setError({ message: "", type: "" });
    }
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === "manufacturer") {
      setFormData({ ...formData, business_id: "" });
    }
    // Clear error when switching roles
    setError({ message: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError({ message: "", type: "" });

    // Client-side validation
    if (!formData.username.trim()) {
      setError({ message: "Please enter your username", type: "username" });
      setIsSubmitting(false);
      return;
    }

    if (!formData.password) {
      setError({ message: "Please enter your password", type: "password" });
      setIsSubmitting(false);
      return;
    }

    if (role === "customer" && !formData.business_id.trim()) {
      setError({ message: "Please enter your business invite code", type: "general" });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await loginUser(
        formData.username,
        formData.password,
        role === "customer" ? formData.business_id : null
      );

      const { access, role: userRole, is_approved } = response;
      await updateCurrentUser({ token: access, role: userRole });
      sessionStorage.setItem("role", userRole);

      if (userRole === "manufacturer") {
        navigate("/dashboard/manufacturer");
      } else if (userRole === "customer") {
        const approved = String(is_approved).toLowerCase() === "true";
        navigate(approved ? "/dashboard/customer" : "/pending-approval");
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again";
      let errorType = "general";
      
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400) {
          if (data.detail && data.detail.toLowerCase().includes("password")) {
            errorMessage = "Password is incorrect. Please try again";
            errorType = "password";
          } else if (data.detail && data.detail.toLowerCase().includes("username")) {
            errorMessage = "Username is incorrect. Please try again";
            errorType = "username";
          } else if (data.detail && data.detail.toLowerCase().includes("credentials")) {
            errorMessage = "Invalid credentials. Please try again";
          }
        } else if (status === 401) {
          errorMessage = "Unauthorized. Please check your credentials";
        } else if (status === 404) {
          errorMessage = "Account not found. Please register first";
          errorType = "account";
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection";
      }
      
      setError({ message: errorMessage, type: errorType });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Streamline your manufacturing and customer management in one powerful platform
          </motion.p>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
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
              Welcome Back
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: colors.textLight }}
            >
              Sign in to access your dashboard
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
                onClick={() => handleRoleChange("manufacturer")}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${role === "manufacturer" ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                style={{ 
                  backgroundColor: role === "manufacturer" ? colors.white : 'transparent',
                  color: role === "manufacturer" ? colors.primary : colors.textLight
                }}
              >
                <Factory className="mr-2" size={18} />
                Manufacturer
              </button>
              <button
                onClick={() => handleRoleChange("customer")}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${role === "customer" ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                style={{ 
                  backgroundColor: role === "customer" ? colors.white : 'transparent',
                  color: role === "customer" ? colors.primary : colors.textLight
                }}
              >
                <ShoppingCart className="mr-2" size={18} />
                Customer
              </button>
            </div>
          </motion.div>

          {/* Error Message */}
          {error.message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 py-3 rounded-lg mb-6 text-sm flex items-center ${
                error.type === 'account' ? 'bg-blue-50 border border-blue-100' : 'bg-rose-50 border border-rose-100'
              }`}
              style={{ 
                color: error.type === 'account' ? colors.primary : colors.error
              }}
            >
              <div className="flex-1">
                {error.message}
                {error.type === 'account' && (
                  <button 
                    onClick={() => navigate("/register")}
                    className="ml-2 font-medium underline hover:text-primary"
                  >
                    Register now
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Login Form */}
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
                  color: error.type === 'username' ? colors.error : colors.textLighter 
                }} />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-lg border focus:border-primary focus:ring-1 outline-none transition ${
                    error.type === 'username' ? 'border-rose-300 focus:ring-rose-200' : 'border-gray-200 focus:ring-primary'
                  }`}
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.white
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: error.type === 'password' ? colors.error : colors.textLighter 
                }} />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-lg border focus:border-primary focus:ring-1 outline-none transition ${
                    error.type === 'password' ? 'border-rose-300 focus:ring-rose-200' : 'border-gray-200 focus:ring-primary'
                  }`}
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.white
                  }}
                />
              </div>
              {role === "manufacturer" && (
                <div className="mt-2 flex justify-start">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm flex items-center"
                    style={{ color: colors.textLight }}
                  >
                    <Key className="mr-1" size={14} style={{ color: colors.primary }} />
                    Forgot password?
                  </motion.button>
                </div>
              )}
            </div>

            {role === "customer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: colors.textLight }}>Business Invite Code</label>
                  <input
                    type="text"
                    name="business_id"
                    placeholder="Enter invite code from manufacturer"
                    value={formData.business_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                    style={{ 
                      borderColor: error.type === 'general' ? colors.error : colors.border,
                      color: colors.text,
                      backgroundColor: colors.white
                    }}
                  />
                </div>
                <div className="flex justify-start">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm flex items-center"
                    style={{ color: colors.textLight }}
                  >
                    <Key className="mr-1" size={14} style={{ color: colors.primary }} />
                    Forgot password?
                  </motion.button>
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center mt-6 ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: colors.primary }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2" size={18} />
                </>
              )}
            </motion.button>

            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: colors.textLight }}>
                Don't have an account?{' '}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-medium inline-flex items-center"
                  style={{ color: colors.primary }}
                >
                  <UserPlus className="mr-1" size={14} />
                  Register
                </motion.button>
              </p>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;