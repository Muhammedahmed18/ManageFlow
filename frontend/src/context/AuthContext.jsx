import { createContext, useState, useContext, useEffect } from 'react';
import { getUserProfile } from '../services/authService';

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  logout: () => {},
  storeRegistrationEmail: () => {},
  getRegistrationEmail: () => {},
  clearRegistrationEmail: () => {},
  updateCurrentUser: () => {},
  isAuthenticated: false,
  getRole: () => null,
  getTokens: () => ({ access: null, refresh: null })
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and verify token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('accessToken');
      const role = sessionStorage.getItem('role');
      
      if (token && role) {
        try {
          // Fetch user profile data to get full user information
          const userProfile = await getUserProfile();
          setCurrentUser({ 
            token, 
            role,
            ...userProfile // Include all user profile data (username, email, first_name, last_name, etc.)
          });
        } catch (error) {
          console.warn('Failed to fetch user profile:', error);
          // If profile fetch fails, still set basic user data
          setCurrentUser({ token, role });
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const logout = async (skipApiCall = false) => {
    try {
      // Skip API call if account was deleted or if explicitly requested
      if (!skipApiCall) {
        const refresh = sessionStorage.getItem("refreshToken");
        const access = sessionStorage.getItem("accessToken");
        
        if (refresh && access) {
          // Simple logout API call with both tokens
          const response = await fetch('http://localhost:8000/api/auth/logout/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh }),
          });
          
          // Don't throw error if logout API fails - just log it
          if (!response.ok) {
            console.warn('Logout API returned status:', response.status);
          }
        }
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      sessionStorage.clear();
      setCurrentUser(null);
    }
  };

  const storeRegistrationEmail = (email) => {
    sessionStorage.setItem('registrationEmail', email);
  };

  const getRegistrationEmail = () => {
    return sessionStorage.getItem('registrationEmail');
  };

  const clearRegistrationEmail = () => {
    sessionStorage.removeItem('registrationEmail');
  };

  const updateCurrentUser = async (userData) => {
    if (userData?.token) {
      sessionStorage.setItem('accessToken', userData.token);
    }
    if (userData?.role) {
      sessionStorage.setItem('role', userData.role);
    }
    
    // If we have a token, try to fetch the full user profile
    if (userData?.token) {
      try {
        const userProfile = await getUserProfile();
        setCurrentUser({ 
          ...userData,
          ...userProfile // Include all user profile data
        });
      } catch (error) {
        console.warn('Failed to fetch user profile during login:', error);
        // If profile fetch fails, still set the basic user data
        setCurrentUser(userData);
      }
    } else {
      setCurrentUser(userData);
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
    storeRegistrationEmail,
    getRegistrationEmail,
    clearRegistrationEmail,
    updateCurrentUser,
    isAuthenticated: !!currentUser && !!sessionStorage.getItem("accessToken"),
    getRole: () => sessionStorage.getItem("role"),
    getTokens: () => ({
      access: sessionStorage.getItem("accessToken"),
      refresh: sessionStorage.getItem("refreshToken")
    })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
