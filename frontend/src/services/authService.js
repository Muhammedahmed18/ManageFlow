import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData - let browser set multipart/form-data automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.warn('No refresh token available, redirecting to login');
        sessionStorage.clear();
        localStorage.setItem("loginRedirectMessage", "Your session has expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token...');
        const res = await api.post("/auth/refresh/", { refresh: refreshToken });
        const { access, refresh } = res.data;

        if (access) {
          sessionStorage.setItem("accessToken", access);
          if (refresh) {
            sessionStorage.setItem("refreshToken", refresh);
          }
          
          // Update the original request with new token
          originalRequest.headers["Authorization"] = `Bearer ${access}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        sessionStorage.clear();
        localStorage.setItem("loginRedirectMessage", "Your session has expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Simple authentication functions
export const loginUser = async (username, password, business_id, role) => {
  try {
    const requestData = {
      username,
      password
    };
    
    // Only add role if it's provided
    if (role) {
      requestData.role = role;
    }
    
    // Only add business_id if it's provided and not null
    if (business_id) {
      requestData.business_id = business_id;
    }
    
    console.log('Login request data:', requestData);
    
    const response = await api.post('/auth/login/', requestData);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error details:', error.response?.data);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendRegistrationOTP = async (userData) => {
  try {
    const response = await api.post('/auth/send-registration-otp/', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp/', { email, otp });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/send-reset-otp/', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password/', {
      email,
      otp,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resendRegistrationOTP = async (email) => {
  try {
    const response = await api.post('/auth/resend-registration-otp/', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile/', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async (skipApiCall = false) => {
  try {
    // Skip API call if account was deleted or if explicitly requested
    if (!skipApiCall) {
      const refresh = sessionStorage.getItem("refreshToken");
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    sessionStorage.clear();
  }
};

export { api };
export default api;


// ==================== Product Management ====================

export const createProduct = async (formData) => {
  return await api.post('/products/', formData);
};

export const updateProduct = async (formData, productId) => {
  return await api.put(`/products/${productId}/`, formData);
};