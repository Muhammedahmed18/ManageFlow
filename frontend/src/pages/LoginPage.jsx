import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { Lock, User, Factory, Users, ArrowRight, Key, UserPlus, Home, Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import colors from '../assets/colors';

const LoginPage = () => {
  const [role, setRole] = useState("manufacturer");
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { updateCurrentUser, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState({
    message: "",
    type: "" // can be 'username', 'password', 'account', 'network', or 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  // Show loading spinner while AuthContext is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.ivory }}>
            <Loader2 className="animate-spin" size={32} style={{ color: colors.primary }} />
          </div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

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

  const getErrorIcon = (type) => {
    switch (type) {
      case 'username':
        return <User className="w-4 h-4 text-red-500" />;
      case 'password':
        return <Lock className="w-4 h-4 text-red-500" />;
      case 'network':
        return <Key className="w-4 h-4 text-orange-500" />;
      case 'account':
        return <UserPlus className="w-4 h-4 text-yellow-500" />;
      default:
        return <ArrowRight className="w-4 h-4 text-red-500" />;
    }
  };

  const getErrorStyle = (type) => {
    switch (type) {
      case 'username':
      case 'password':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'network':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'account':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      default:
        return 'bg-red-50 text-red-700 border border-red-200';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError({ message: "", type: "" });

    // Client-side validation with specific messages
    if (!formData.username.trim()) {
      setError({ 
        message: "Please enter your username or email", 
        type: "username" 
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.password) {
      setError({ 
        message: "Please enter your password", 
        type: "password" 
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await loginUser(
        formData.username,
        formData.password,
        null,
        role
      );

      const { access, refresh, role: userRole } = response;
      
      // Frontend double-check: compare selected role with userRole returned from backend
      if (userRole !== role) {
        setError({
          message: `You selected the wrong account type. Please switch to ${userRole} tab.`,
          type: "account"
        });
        setIsSubmitting(false);
        return;
      }
      
      await updateCurrentUser({ token: access, role: userRole });
      sessionStorage.setItem("role", userRole);
      sessionStorage.setItem("accessToken", access);
      sessionStorage.setItem("refreshToken", refresh);

      if (userRole === "manufacturer") {
        navigate("/dashboard/manufacturer");
      } else if (userRole === "customer") {
        navigate("/dashboard/customer");
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again";
      let errorType = "general";
      
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400) {
          // Bad Request - Invalid credentials or field validation
          if (data.detail) {
            const detail = data.detail.toLowerCase();
            
            // Check for role mismatch errors first
            if (detail.includes("this account is a") && detail.includes("not a")) {
              errorMessage = "You selected the wrong account type. Please switch to the correct tab and try again.";
              errorType = "account";
            } else if (detail.includes("password") && detail.includes("incorrect")) {
              errorMessage = "Password is incorrect. Please try again";
              errorType = "password";
            } else if (detail.includes("username") && detail.includes("incorrect")) {
              errorMessage = "Username or email is incorrect. Please try again";
              errorType = "username";
            } else if (detail.includes("invalid credentials") || detail.includes("credentials")) {
              errorMessage = "Username/email or password is incorrect. Please check and try again";
              errorType = "general";
            } else if (detail.includes("account") && (detail.includes("disabled") || detail.includes("inactive") || detail.includes("suspended"))) {
              errorMessage = data.detail; // Show exact server message for account status
              errorType = "account";
            } else {
              errorMessage = data.detail;
              errorType = "general";
            }
          } else if (data.username) {
            errorMessage = "Please enter a valid username or email";
            errorType = "username";
          } else if (data.password) {
            errorMessage = "Please enter your password";
            errorType = "password";
          }
        } else if (status === 401) {
          // Unauthorized - Wrong credentials
          errorMessage = "Username/email or password is incorrect. Please try again";
          errorType = "general";
        } else if (status === 404) {
          // Not Found - User doesn't exist
          errorMessage = "Account not found. Please register first";
          errorType = "account";
        } else if (status === 403) {
          // Forbidden - Account might be disabled
          errorMessage = data.detail || "This account is disabled. Please contact support";
          errorType = "account";
        } else if (status >= 500) {
          // Server errors
          errorMessage = "Server error. Please try again later";
          errorType = "network";
        }
      } else if (err.request) {
        // Network error - no response received
        errorMessage = "Network error. Please check your connection";
        errorType = "network";
      } else {
        // Something else happened
        errorMessage = "An unexpected error occurred. Please try again";
        errorType = "general";
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
            The ultimate B2B marketplace connecting manufacturers with customers and providing comprehensive business management tools
          </motion.p>
        </div>
      </motion.div>

      {/* Right Panel - Login Form */}
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
              Welcome Back
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: colors.textSecondary }}
            >
              Sign in to your account to continue
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
                  role === "manufacturer" 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ 
                  backgroundColor: role === "manufacturer" ? colors.primary + '10' : colors.background,
                  borderColor: role === "manufacturer" ? colors.primary : colors.border
                }}
              >
                <Factory className="w-5 h-5 mr-2" style={{ color: role === "manufacturer" ? colors.primary : colors.textSecondary }} />
                <span className="font-medium" style={{ color: role === "manufacturer" ? colors.primary : colors.textPrimary }}>
                  Manufacturer
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleRoleChange("customer")}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center ${
                  role === "customer" 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ 
                  backgroundColor: role === "customer" ? colors.primary + '10' : colors.background,
                  borderColor: role === "customer" ? colors.primary : colors.border
                }}
              >
                <Users className="w-5 h-5 mr-2" style={{ color: role === "customer" ? colors.primary : colors.textSecondary }} />
                <span className="font-medium" style={{ color: role === "customer" ? colors.primary : colors.textPrimary }}>
                  Customer
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Enhanced Error Display */}
          {error.message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg mb-4 text-sm flex items-start gap-2 ${getErrorStyle(error.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getErrorIcon(error.type)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{error.message}</p>
                {error.type === 'account' && (
                  <p className="text-xs mt-1 opacity-80">
                    Need help? Contact support or try registering a new account.
                  </p>
                )}
                {error.type === 'network' && (
                  <p className="text-xs mt-1 opacity-80">
                    Check your internet connection and try again.
                  </p>
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
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: error.type === 'username' ? '#ef4444' : colors.textSecondary 
                }} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                    error.type === 'username' 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  style={{ 
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ 
                  color: error.type === 'password' ? '#ef4444' : colors.textSecondary 
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border focus:ring-2 outline-none transition ${
                    error.type === 'password' 
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
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.primary }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
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
            className="mt-6 text-center space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/forgot-password")}
              className="block text-sm hover:underline"
              style={{ color: colors.primary }}
            >
              Forgot your password?
            </motion.button>
            
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              Don't have an account?{' '}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/register")}
                className="font-medium hover:underline"
                style={{ color: colors.primary }}
              >
                Sign up here
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;