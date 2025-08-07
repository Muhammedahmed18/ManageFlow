import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Add the access token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and retry requests
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    const isExpired = error.response?.status === 401 && !originalRequest._retry;

    if (isExpired) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem("refreshToken");

      if (!refreshToken) {
        sessionStorage.clear();
        localStorage.setItem("loginRedirectMessage", "Your session has expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await api.post("/auth/refresh/", { refresh: refreshToken });
        const { access, refresh } = res.data;

        if (access) sessionStorage.setItem("accessToken", access);
        if (refresh) sessionStorage.setItem("refreshToken", refresh);

        originalRequest.headers["Authorization"] = `Bearer ${access}`;
        window.dispatchEvent(new Event("tokenRefreshed"));
        return api(originalRequest);
      } catch (refreshError) {
        // Token is blacklisted or invalid
        sessionStorage.clear();
        localStorage.setItem("loginRedirectMessage", "Your session has expired. Please log in again.");
        localStorage.setItem("lastEmail", sessionStorage.getItem("lastEmail") || "");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const sendRegistrationOTP = async (userData) => {
  try {
    const response = await api.post('/auth/send-registration-otp/', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send registration OTP' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp/', { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'OTP verification failed' };
  }
};

export const loginUser = async (username, password, business_id = null, role = null) => {
  const payload = { username, password };
  if (business_id) payload.business_id = business_id;
  if (role) payload.role = role;

  try {
    const response = await api.post('/auth/login/', payload);
    const { access, refresh, role: returnedRole, is_approved } = response.data;

    // ✅ Block login if backend returned different role
    if (role && returnedRole && role !== returnedRole) {
      throw {
        response: {
          status: 400,
          data: {
            detail: `This account is a ${returnedRole}, not a ${role}.`
          }
        }
      };
    }

    // ✅ Store tokens only if everything checks out
    if (access && refresh) {
      sessionStorage.setItem("accessToken", access);
      sessionStorage.setItem("refreshToken", refresh);
      localStorage.setItem("lastEmail", username);
    }

    return response.data;
  } catch (error) {
    // Always throw an error object with a .response property for consistent frontend handling
    if (error.response) {
      throw error;
    } else if (error.detail) {
      throw {
        response: {
          status: 400,
          data: { detail: error.detail }
        }
      };
    } else {
      throw {
        response: {
          status: 400,
          data: { detail: error.message || 'Login failed' }
        }
      };
    }
  }
};

export const logoutUser = async () => {
  try {
    const refresh = sessionStorage.getItem('refreshToken');
    await api.post('/auth/logout/', { refresh });
  } catch {}
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/send-reset-otp/', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send reset OTP' };
  }
};

export const resendRegistrationOTP = async (email) => {
  try {
    const response = await api.post('/auth/resend-registration-otp/', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to resend registration OTP' };
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
    throw error.response?.data || { message: 'Password reset failed' };
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};

export const handleDeleteAccount = async (password) => {
  try {
    // First verify the password
    const verifyResponse = await api.post('/auth/verify-password/', { password });
    
    if (verifyResponse.data.valid) {
      // Then delete the account with password verification
      await api.delete('/auth/delete-account/', { data: { password } });
      await logoutUser();
      return { success: true, message: 'Account deleted successfully.' };
    } else {
      throw new Error('Incorrect password');
    }
  } catch (err) {
    console.error('Failed to delete account:', err);
    if (err.response?.status === 400) {
      throw new Error('Incorrect password. Please try again.');
    } else {
      throw new Error('Failed to delete account. Please try again.');
    }
  }
};

export default api;


// ==================== Product Management ====================

export const createProduct = async (formData) => {
  return await api.post('/products/', formData);
};

export const updateProduct = async (formData, productId) => {
  return await api.put(`/products/${productId}/`, formData);
};