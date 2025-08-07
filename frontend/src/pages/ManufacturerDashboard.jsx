import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Trash2, Edit2, PlusCircle, LogOut, ChevronLeft, ChevronRight, User, Globe, Loader2 } from "lucide-react";
import api from "../services/authService";
import { useAuth } from "../context/AuthContext";

const ManufacturerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const userMenuRef = useRef(null);

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

  const approvedBusinesses = businesses.filter(biz => biz.status === 'approved');
  const pendingBusinesses = businesses.filter(biz => biz.status === 'pending' || biz.status === 'rejected' || biz.status === 'access_revoked');

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);

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
    const token = sessionStorage.getItem("accessToken");
  
    try {
      await axios.delete("http://127.0.0.1:8000/api/auth/delete-account/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      sessionStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Delete account error:", error);
      setShowDeleteAccountModal(false);
      showToast("Failed to delete account. Please try again.", "error");
    }
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
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
      const res = await api.get(`/management/manufacturer/businesses/?page=${page}&limit=${BUSINESSES_PER_PAGE}`);
      if (res.data.results.length === 0 && page > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setBusinesses(res.data.results);
        setTotalBusinesses(res.data.count);
        setIsLoaded(true);
      }
    } catch (err) {
      console.error("Failed to fetch businesses:", err.response?.data || err.message);
      setIsLoaded(true);
    }
  };
  


  const handleJoinBusiness = async () => {
    setJoinLoading(true);
    setJoinError("");
    try {
      await api.post("/business/businesses/link/", { invite_code: inviteCode });
      showToast("Request sent. Pending approval!");
      setInviteCode("");
      fetchBusinesses();
      setShowInviteForm(false);
    } catch (err) {
      setJoinError(err.response?.data?.detail || "Failed to join business.");
    } finally {
      setJoinLoading(false);
    }
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
    <div className={`min-h-screen p-4 md:p-8 ${showDeleteAccountModal ? "overflow-hidden" : ""}`}
         style={{ 
           background: `linear-gradient(135deg, ${colors.background} 0%, #E9ECEF 100%)`,
           fontFamily: "'Open Sans', sans-serif"
         }}>
      
      <AnimatePresence>
        {showDeleteAccountModal && (
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
          showDeleteAccountModal ? "blur-sm" : ""
        } transition-all duration-300`}
      >
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
                  Manufacturer Dashboard
                </h1>
                <p className="mt-1 text-sm opacity-80">Manage your business profiles</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowInviteForm(true)}
                className="flex items-center px-4 py-2 rounded-xl shadow-sm transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: colors.white
                }}
              >
                <Globe className="mr-2" size={18} /> Join Business
              </motion.button>
              
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

        <AnimatePresence mode="wait">
          {approvedBusinesses.length === 0 && pendingBusinesses.length === 0 ? (
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
              <div className="mb-4 text-lg font-semibold" style={{ color: colors.text }}>
                No businesses found
              </div>

              {!showInviteForm ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInviteForm(true)}
                  className="inline-flex items-center px-6 py-3 rounded-lg font-medium mt-4"
                  style={{ 
                    backgroundColor: colors.primary, 
                    color: colors.white,
                    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)'
                  }}
                >
                  <PlusCircle className="mr-2" size={18} /> Join with Invite Code
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 mt-4"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter Invite Code"
                      className="px-4 py-3 rounded-lg border w-full max-w-xs text-center focus:ring-2 focus:ring-offset-1 outline-none transition"
                      style={{ 
                        borderColor: colors.border,
                        color: colors.text,
                        focusRingColor: colors.accent
                      }}
                    />
                  </motion.div>

                  {joinError && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-600 text-sm"
                    >
                      {joinError}
                    </motion.p>
                  )}

                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteCode("");
                        setJoinError("");
                      }}
                      className="px-6 py-2 rounded-lg transition-all border text-sm font-medium"
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
                      onClick={handleJoinBusiness}
                      disabled={joinLoading || !inviteCode}
                      className="px-6 py-2 rounded-lg transition-all flex items-center justify-center text-sm font-medium"
                      style={{ 
                        backgroundColor: joinLoading ? colors.secondary : colors.primary,
                        color: colors.white,
                        cursor: joinLoading ? 'not-allowed' : 'pointer',
                        opacity: joinLoading ? 0.8 : 1
                      }}
                    >
                      {joinLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Joining...
                        </>
                      ) : 'Submit Code'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedBusinesses.map((biz) => (
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
                    <div className="px-6 py-4" style={{ 
                      background: colors.cardHeaderBg,
                      color: colors.white
                    }}>
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold truncate">{biz.name}</h2>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            biz.status === 'approved' ? 'bg-green-100 text-green-800' :
                            biz.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            biz.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {biz.status === 'approved' ? 'Approved' :
                             biz.status === 'pending' ? 'Pending' :
                             biz.status === 'rejected' ? 'Rejected' :
                             biz.status === 'access_revoked' ? 'Access Revoked' :
                             'Rejected'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
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
                        onClick={() => {
                          if (biz.status === 'approved') {
                            navigate(`/manage/${biz.id}`);
                          } else {
                            showToast("Please contact the customer to restore access.", "error");
                          }
                        }}
                        disabled={biz.status !== 'approved'}
                        className={`w-full px-4 py-2 rounded-lg transition-all ${
                          biz.status === 'approved' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                        style={{ 
                          backgroundColor: biz.status === 'approved' ? colors.primary : colors.secondary,
                          color: colors.white
                        }}
                      >
                        {biz.status === 'approved' ? 'Manage Business' : 'Contact Customer'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {pendingBusinesses.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingBusinesses.map((biz) => (
                      <motion.div 
                        key={biz.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ y: -5 }}
                        className="rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg opacity-75"
                        style={{ 
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border
                        }}
                      >
                        <div className="px-6 py-4" style={{ 
                          background: colors.cardHeaderBg,
                          color: colors.white
                        }}>
                          <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold truncate">{biz.name}</h2>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                biz.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                biz.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {biz.status === 'pending' ? 'Pending' : 
                                 biz.status === 'rejected' ? 'Rejected' : 'Access Revoked'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
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
                            onClick={() => {
                              showToast("Please contact the customer to restore access.", "error");
                            }}
                            disabled={true}
                            className="w-full px-4 py-2 rounded-lg transition-all cursor-not-allowed opacity-60"
                            style={{ 
                              backgroundColor: colors.secondary,
                              color: colors.white
                            }}
                          >
                            Contact Customer
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {approvedBusinesses.length > BUSINESSES_PER_PAGE && (
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
                Page {currentPage} of {Math.ceil(approvedBusinesses.length / BUSINESSES_PER_PAGE)}
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(approvedBusinesses.length / BUSINESSES_PER_PAGE)}
                className={`p-2 rounded-lg ${currentPage >= Math.ceil(approvedBusinesses.length / BUSINESSES_PER_PAGE) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                style={{ color: colors.primary }}
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>



      <AnimatePresence>
        {showDeleteAccountModal && (
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
                <h2 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Delete Account</h2>
                <p className="mb-6 text-sm" style={{ color: colors.textLight }}>
                  Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.
                </p>
              </div>
              
              <div className="flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteAccountModal(false)}
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
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2 rounded-lg transition-all text-sm font-medium"
                  style={{ 
                    backgroundColor: colors.error,
                    color: colors.white
                  }}
                >
                  Delete Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteForm && approvedBusinesses.length > 0 && (
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
                <h2 className="text-xl font-bold">Join Business</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: colors.textLight }}>Invite Code *</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter Invite Code"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-1 outline-none transition text-sm"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      focusRingColor: colors.accent
                    }}
                  />
                  {joinError && <p className="text-red-500 text-xs mt-1">{joinError}</p>}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteCode("");
                    setJoinError("");
                  }}
                  disabled={joinLoading}
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
                  onClick={handleJoinBusiness}
                  disabled={joinLoading || !inviteCode}
                  className="flex-1 py-2 rounded-lg transition-all flex items-center justify-center text-sm font-medium"
                  style={{ 
                    backgroundColor: joinLoading ? colors.secondary : colors.primary,
                    color: colors.white,
                    cursor: joinLoading ? 'not-allowed' : 'pointer',
                    opacity: joinLoading ? 0.8 : 1
                  }}
                >
                  {joinLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Joining...
                    </>
                  ) : 'Join Business'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManufacturerDashboard;