/**
 * Enhanced API Service with Performance Optimization
 * =================================================
 * Improved API service with caching, retry logic, and better error handling.
 */

import axios from 'axios';
import { handleApiError, retryApiCall, debounce } from '../utils/errorHandler';

const enhancedApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for caching and authentication
enhancedApi.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add cache metadata for GET requests
    if (config.method === 'get') {
      config.metadata = { startTime: Date.now() };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for caching and error handling
enhancedApi.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = generateCacheKey(response.config);
      const cacheData = {
        data: response.data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = refreshResponse.data;
          sessionStorage.setItem('accessToken', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return enhancedApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Cache utilities
const generateCacheKey = (config) => {
  const { url, params, method } = config;
  const paramString = params ? JSON.stringify(params) : '';
  return `api_cache_${method}_${url}_${paramString}`;
};

const getCachedResponse = (cacheKey) => {
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const cacheData = JSON.parse(cached);
      if (Date.now() < cacheData.expiresAt) {
        return cacheData.data;
      } else {
        sessionStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  return null;
};

// Enhanced API service methods
export const enhancedApiService = {
  // Product methods
  async getProducts(params = {}) {
    const cacheKey = generateCacheKey({ url: '/products/', params, method: 'get' });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await retryApiCall(() => 
        enhancedApi.get('/products/', { params })
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch products');
    }
  },

  async createProduct(productData) {
    try {
      const response = await enhancedApi.post('/products/', productData);
      this.invalidateProductCache();
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create product');
    }
  },

  async updateProduct(productId, productData) {
    try {
      const response = await enhancedApi.patch(`/products/${productId}/`, productData);
      this.invalidateProductCache();
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update product');
    }
  },

  async deleteProduct(productId) {
    try {
      await enhancedApi.delete(`/products/${productId}/`);
      this.invalidateProductCache();
      return { success: true };
    } catch (error) {
      throw handleApiError(error, 'Failed to delete product');
    }
  },

  async bulkCreateProducts(productsData) {
    try {
      const response = await enhancedApi.post('/products/bulk_create/', {
        products: productsData,
        operation: 'create'
      });
      this.invalidateProductCache();
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create products in bulk');
    }
  },

  async getProductAnalytics(businessId) {
    const cacheKey = generateCacheKey({ 
      url: '/products/analytics/', 
      params: { business: businessId }, 
      method: 'get' 
    });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await retryApiCall(() => 
        enhancedApi.get('/products/analytics/', { params: { business: businessId } })
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch product analytics');
    }
  },

  // Order methods
  async getOrders(params = {}) {
    const cacheKey = generateCacheKey({ url: '/orders/', params, method: 'get' });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await retryApiCall(() => 
        enhancedApi.get('/orders/', { params })
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch orders');
    }
  },

  async createOrder(orderData) {
    try {
      const response = await enhancedApi.post('/orders/', orderData);
      this.invalidateOrderCache();
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create order');
    }
  },

  async updateOrderStatus(orderId, statusData) {
    try {
      const response = await enhancedApi.patch(`/orders/${orderId}/update_status/`, statusData);
      this.invalidateOrderCache();
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update order status');
    }
  },

  async getOrderDashboardStats(businessId) {
    const cacheKey = generateCacheKey({ 
      url: '/orders/dashboard_stats/', 
      params: { business: businessId }, 
      method: 'get' 
    });
    const cached = getCachedResponse(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await retryApiCall(() => 
        enhancedApi.get('/orders/dashboard_stats/', { params: { business: businessId } })
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch order dashboard stats');
    }
  },

  // Cache management
  invalidateProductCache() {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.includes('api_cache_get_/products/')) {
        sessionStorage.removeItem(key);
      }
    });
  },

  invalidateOrderCache() {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.includes('api_cache_get_/orders/')) {
        sessionStorage.removeItem(key);
      }
    });
  },

  clearAllCache() {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        sessionStorage.removeItem(key);
      }
    });
  },

  // Utility methods
  async uploadFile(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await enhancedApi.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to upload file');
    }
  },

  async downloadFile(url, filename) {
    try {
      const response = await enhancedApi.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      throw handleApiError(error, 'Failed to download file');
    }
  },
};

// Debounced search functions
export const debouncedProductSearch = debounce(async (searchTerm, params = {}) => {
  if (!searchTerm || searchTerm.length < 2) {
    return { data: [] };
  }
  
  try {
    return await enhancedApiService.getProducts({
      ...params,
      search: searchTerm,
    });
  } catch (error) {
    console.error('Search error:', error);
    return { data: [] };
  }
}, 300);

export const debouncedOrderSearch = debounce(async (searchTerm, params = {}) => {
  if (!searchTerm || searchTerm.length < 2) {
    return { data: [] };
  }
  
  try {
    return await enhancedApiService.getOrders({
      ...params,
      search: searchTerm,
    });
  } catch (error) {
    console.error('Search error:', error);
    return { data: [] };
  }
}, 300);

// Advanced Dashboard API methods
export const dashboardApi = {
  getDashboardData: async (days = 30) => {
    return await enhancedApiService.getProducts({ days });
  },

  getProductPerformance: async (productId = null, days = 30) => {
    const params = { days };
    if (productId) params.product_id = productId;
    return await enhancedApiService.getProducts(params);
  },

  getTrendAnalysis: async (metric = 'orders', days = 90) => {
    return await enhancedApiService.getOrders({ metric, days });
  },

  getQuickStats: async (days = 30) => {
    return await enhancedApiService.getOrderDashboardStats();
  }
};

// Advanced Search API methods
export const searchApi = {
  searchProducts: async (query = '', filters = {}, page = 1, pageSize = 20) => {
    const params = {
      search: query,
      page,
      page_size: pageSize,
      ...filters
    };
    return await enhancedApiService.getProducts(params);
  },

  searchOrders: async (query = '', filters = {}, page = 1, pageSize = 20) => {
    const params = {
      search: query,
      page,
      page_size: pageSize,
      ...filters
    };
    return await enhancedApiService.getOrders(params);
  },

  getSearchSuggestions: async (query, type = 'products') => {
    if (type === 'products') {
      return await enhancedApiService.getProducts({ search: query, limit: 10 });
    } else {
      return await enhancedApiService.getOrders({ search: query, limit: 10 });
    }
  },

  getAdvancedFilters: async () => {
    // This would typically fetch from a dedicated endpoint
    return {
      products: {
        categories: [],
        status_options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      orders: {
        status_options: [
          { value: 'pending', label: 'Pending' },
          { value: 'processing', label: 'Processing' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      }
    };
  }
};

// Report Generation API methods
export const reportApi = {
  generateProductsReport: async (format = 'excel') => {
    return await enhancedApiService.downloadFile('/api/reports/generate_products_report/', `products_report_${new Date().toISOString().split('T')[0]}.${format}`);
  },

  generateOrdersReport: async (format = 'excel', startDate = null, endDate = null) => {
    const params = new URLSearchParams({ format });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return await enhancedApiService.downloadFile(`/api/reports/generate_orders_report/?${params}`, `orders_report_${new Date().toISOString().split('T')[0]}.${format}`);
  }
};

export default enhancedApiService;
