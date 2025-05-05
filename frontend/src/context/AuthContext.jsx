import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncUserFromStorage = () => {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        setCurrentUser({ token });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    syncUserFromStorage();

    const handleTokenRefresh = () => {
      const refreshedToken = sessionStorage.getItem('accessToken');
      if (refreshedToken) {
        setCurrentUser({ token: refreshedToken });
      }
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
    };
  }, []);

  const logout = async () => {
    try {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('role');
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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

  const updateCurrentUser = (userData) => {
    if (userData?.token) {
      sessionStorage.setItem('accessToken', userData.token);
    }
    setCurrentUser(userData);
  };

  const value = {
    currentUser,
    loading,
    error,
    logout,
    storeRegistrationEmail,
    getRegistrationEmail,
    clearRegistrationEmail,
    updateCurrentUser,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
