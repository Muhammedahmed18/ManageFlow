import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, Edit2, PlusCircle, LogOut, ChevronLeft, ChevronRight, User, Globe, Loader2 } from "lucide-react";
import api from "../services/authService";
import { useAuth } from "../context/AuthContext";
import AccountDeletionModal from "../components/shared/AccountDeletionModal";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const userMenuRef = useRef(null);

  // Updated color scheme with accents and gradients
  const colors = {
    primary: '#1C2E4A',
    primaryLight: '#3A4D6B',
    secondary: '#52677D',
    accent: '#4F46E5',
    accentLight: '#818CF8',
    background: '#F8F9FA',
    cardBg: '#FFFFFF',
    cardHeaderBg: 'linear-gradient(135deg, #1C2E4A 0%, #3A4D6B 100%)',
    headerBg: 'linear-gradient(135deg, #1C2E4A 0%, #2C3E5A 100%)',
    text: '#1E293B',
    textLight: '#64748B',
    textLighter: '#94A3B8',
    border: '#E2E8F0',
    white: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
  };

  const [businesses, setBusinesses] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const BUSINESSES_PER_PAGE = 3;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Form states
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    slogan: "",
    shipping_country: ""
  });
  const [editBusiness, setEditBusiness] = useState({
    name: "",
    slogan: "",
    shipping_country: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const refresh = sessionStorage.getItem("refreshToken");
    const token = sessionStorage.getItem("accessToken");
  
    try {
      if (refresh && token) {
        await axios.post(
          "http://127.0.0.1:8000/api/auth/logout/",
          { refresh },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (err) {
      console.warn("Logout error:", err);
    }
  
    sessionStorage.clear();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    // This function is now handled by AccountDeletionModal
    // The modal will handle password verification and account deletion
  };

  const handleAccountDeletionSuccess = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === "error" ? "bg-red-600" : "bg-emerald-600"
    } text-white font-medium flex items-center`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-300");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const fetchBusinesses = async (page = 1) => {
    try {
      const res = await api.get(`/management/businesses/?page=${page}&limit=${BUSINESSES_PER_PAGE}`);
      let businesses = [];
      let total = 0;
      if (res.data) {
        if (Array.isArray(res.data.results)) {
          businesses = res.data.results;
          total = res.data.count || businesses.length;
        } else if (Array.isArray(res.data)) {
          businesses = res.data;
          total = businesses.length;
        }
      }
      setBusinesses(businesses);
      setTotalBusinesses(total);
      setIsLoaded(true);
    } catch (err) {
      setIsLoaded(true);
      setBusinesses([]);
      setTotalBusinesses(0);
      if (err.response && err.response.status === 401) {
        alert('Session expired. Please log in again.');
        // Optionally, navigate('/login');
      } else {
        console.error("Failed to fetch businesses:", err);
      }
    }
  };
  

  const handleAddBusiness = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await api.post("/management/businesses/", newBusiness);
      fetchBusinesses(currentPage);
      setShowAddModal(false);
      setNewBusiness({
        name: "",
        slogan: "",
        shipping_country: ""
      });
      showToast("Business created successfully!");
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      }
      console.error("Failed to add business:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBusiness = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await api.put(`/management/businesses/${selectedBusiness.id}/`, editBusiness);
      fetchBusinesses(currentPage);
      setShowEditModal(false);
      showToast("Business updated successfully!");
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      }
      console.error("Failed to edit business:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBusiness = async () => {
    try {
      await api.delete(`/management/businesses/${selectedBusiness.id}/`);
  
      const remainingBusinesses = businesses.length - 1;
      const isLastItemOnPage = remainingBusinesses === 0 && currentPage > 1;
  
      if (isLastItemOnPage) {
        setCurrentPage(prev => prev - 1);
      } else {
        fetchBusinesses(currentPage);
      }
  
      setShowDeleteModal(false);
      showToast("Business deleted successfully!");
    } catch (err) {
      console.error("Failed to delete business:", err);
      showToast("Failed to delete business. Please try again.", "error");
    }
  };
  

  const openEditModal = (business) => {
    setSelectedBusiness(business);
    setEditBusiness({
      name: business.name,
      slogan: business.slogan,
      shipping_country: business.shipping_country
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    if (!loading && currentUser) {
      fetchBusinesses(currentPage);
    }
  }, [currentPage, loading, currentUser]);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ 
        background: `linear-gradient(135deg, ${colors.background} 0%, #E9ECEF 100%)`
      }}>
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 border-4 rounded-full"
          style={{ borderColor: colors.accent, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 ${(showAddModal || showEditModal || showDeleteModal || showDeleteAccountModal) ? "overflow-hidden" : ""}`}
         style={{ 
           background: `linear-gradient(135deg, ${colors.background} 0%, #E9ECEF 100%)`,
           fontFamily: "'Open Sans', sans-serif"
         }}>
      
      {/* Blur overlay for modals */}
      <AnimatePresence>
        {(showAddModal || showEditModal || showDeleteModal || showDeleteAccountModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-xl z-40"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`container mx-auto max-w-7xl ${
          (showAddModal || showEditModal || showDeleteModal || showDeleteAccountModal) ? "blur-sm" : ""
        } transition-all duration-300`}
      >
        {/* Sticky Header Section with Rounded Corners and Blur */}
        <div className="sticky top-4 z-30 py-4 px-6 mb-8 rounded-2xl shadow-md"
             style={{ 
               background: colors.headerBg,
               color: colors.white,
               backdropFilter: 'blur(10px)',
               backgroundColor: 'rgba(28, 46, 74, 0.8)'
             }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ 
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "-0.025em"
                }}>
                  Customer Dashboard
                </h1>
                <p className="mt-1 text-sm opacity-80">Manage your business profiles</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {businesses.length > 0 && (
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-4 py-2 rounded-xl shadow-sm transition-all"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: colors.white
                  }}
                >
                  <PlusCircle className="mr-2" size={18} /> Add Business
                </motion.button>
              )}
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center px-4 py-2 rounded-xl shadow-sm transition-all"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: colors.white,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <User className="mr-2" size={18} /> 
                  {currentUser?.username || "Account"}
                </motion.button>
                
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
                      style={{ 
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowDeleteAccountModal(true);
                          }}
                          className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50"
                          style={{ color: colors.error }}
                        >
                          <Trash2 className="mr-2" size={16} /> Delete Account
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50"
                          style={{ color: colors.text }}
                        >
                          <LogOut className="mr-2" size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Business Cards Grid */}
        <AnimatePresence mode="wait">
          {businesses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center py-16 rounded-2xl border"
              style={{ 
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="mb-2 text-lg" style={{ color: colors.textLight }}>No businesses found</div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="font-medium inline-flex items-center px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  color: colors.white
                }}
              >
                <PlusCircle className="mr-1" size={16} /> Create your first business
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz) => (
                <motion.div 
                  key={biz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg"
                  style={{ 
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border
                  }}
                >
                  {/* Card Header */}
                  <div className="px-6 py-4" style={{ 
                    background: colors.cardHeaderBg,
                    color: colors.white
                  }}>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold truncate">{biz.name}</h2>
                      <div className="flex space-x-2">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEditModal(biz)}
                          className="p-1"
                          title="Edit"
                          style={{ color: colors.white }}
                        >
                          <Edit2 size={16} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedBusiness(biz);
                            setShowDeleteModal(true);
                          }}
                          className="p-1"
                          title="Delete"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-6 py-4">
                    {biz.slogan && (
                      <p className="italic mb-4 text-sm" style={{ color: colors.textLight }}>&quot;{biz.slogan}&quot;</p>
                    )}
                    
                    <div className="flex items-center mb-6 text-sm" style={{ color: colors.textLight }}>
                      <Globe className="mr-2" size={16} />
                      <span>Shipping to: {biz.shipping_country}</span>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/manage/customer/${biz.id}`)}
                      className="w-full px-4 py-2 rounded-lg transition-all"
                      style={{ 
                        backgroundColor: colors.primary,
                        color: colors.white
                      }}
                    >
                      Manage Business
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalBusinesses > BUSINESSES_PER_PAGE && (
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-2 rounded-xl p-2 border"
                 style={{ 
                   backgroundColor: colors.cardBg,
                   borderColor: colors.border
                 }}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                style={{ color: colors.primary }}
              >
                <ChevronLeft size={20} />
              </motion.button>
              
              <div className="px-4 py-1 rounded-lg text-sm font-medium"
                   style={{ 
                     backgroundColor: colors.primary,
                     color: colors.white
                   }}>
                Page {currentPage} of {Math.ceil(totalBusinesses / BUSINESSES_PER_PAGE)}
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(totalBusinesses / BUSINESSES_PER_PAGE)}
                className={`p-2 rounded-lg ${currentPage >= Math.ceil(totalBusinesses / BUSINESSES_PER_PAGE) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                style={{ color: colors.primary }}
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Business Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md border shadow-2xl z-50"
              style={{ borderColor: colors.border }}
            >
              <div className="px-4 py-3 mb-4 rounded-t-lg -mx-6 -mt-6" 
                   style={{ 
                     background: colors.cardHeaderBg, 
                     color: colors.white,
                     borderTopLeftRadius: '0.5rem',
                     borderTopRightRadius: '0.5rem'
                   }}>
                <h2 className="text-xl font-bold">Add New Business</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Business Name *</label>
                  <input 
                    type="text" 
                    value={newBusiness.name}
                    onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                    placeholder="Enter business name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Slogan (Optional)</label>
                  <input 
                    type="text" 
                    value={newBusiness.slogan}
                    onChange={(e) => setNewBusiness({...newBusiness, slogan: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                    placeholder="Enter slogan"
                  />
                  {errors.slogan && <p className="text-red-500 text-xs mt-1">{errors.slogan}</p>}
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Shipping Country *</label>
                  <input
                    type="text"
                    value={newBusiness.shipping_country}
                    onChange={(e) => setNewBusiness({...newBusiness, shipping_country: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                    placeholder="Enter shipping country (e.g., United States)"
                  />
                  {errors.shipping_country && <p className="text-red-500 text-xs mt-1">{errors.shipping_country}</p>}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAddModal(false);
                    setErrors({});
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg transition-all border text-sm font-medium"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.textLight
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddBusiness}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg transition-all flex items-center justify-center text-sm font-medium"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: colors.white
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Creating...
                    </>
                  ) : 'Create Business'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Business Modal */}
      <AnimatePresence>
        {showEditModal && selectedBusiness && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md border shadow-2xl z-50"
              style={{ borderColor: colors.border }}
            >
              <div className="px-4 py-3 mb-4 rounded-t-lg -mx-6 -mt-6" 
                   style={{ 
                     background: colors.cardHeaderBg, 
                     color: colors.white,
                     borderTopLeftRadius: '0.5rem',
                     borderTopRightRadius: '0.5rem'
                   }}>
                <h2 className="text-xl font-bold">Edit Business</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Business Name *</label>
                  <input 
                    type="text" 
                    value={editBusiness.name}
                    onChange={(e) => setEditBusiness({...editBusiness, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Slogan</label>
                  <input 
                    type="text" 
                    value={editBusiness.slogan}
                    onChange={(e) => setEditBusiness({...editBusiness, slogan: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                  />
                  {errors.slogan && <p className="text-red-500 text-xs mt-1">{errors.slogan}</p>}
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Shipping Country *</label>
                  <input
                    type="text"
                    value={editBusiness.shipping_country}
                    onChange={(e) => setEditBusiness({...editBusiness, shipping_country: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                    placeholder="Enter shipping country (e.g., United States)"
                  />
                  {errors.shipping_country && <p className="text-red-500 text-xs mt-1">{errors.shipping_country}</p>}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowEditModal(false);
                    setErrors({});
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg transition-all border text-sm font-medium"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.textLight
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditBusiness}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-lg transition-all flex items-center justify-center text-sm font-medium"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: colors.white
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Business Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedBusiness && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md border shadow-2xl z-50"
              style={{ borderColor: colors.border }}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                     style={{ backgroundColor: '#fee2e2' }}>
                  <Trash2 className="text-red-500" size={24} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Delete Business</h2>
                <p className="mb-6 text-sm" style={{ color: colors.textLight }}>
                  Are you sure you want to permanently delete <span className="font-medium" style={{ color: colors.text }}>"{selectedBusiness.name}"</span>?
                </p>
              </div>
              
              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-lg transition-all border text-sm font-medium"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.textLight
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteBusiness}
                  className="flex-1 py-2 rounded-lg transition-all text-sm font-medium"
                  style={{ 
                    backgroundColor: colors.error,
                    color: colors.white
                  }}
                >
                  Delete Permanently
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onSuccess={handleAccountDeletionSuccess}
        userType="customer"
      />
    </div>
  );
};

export default CustomerDashboard;