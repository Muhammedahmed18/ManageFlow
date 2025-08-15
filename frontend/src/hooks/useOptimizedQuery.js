/**
 * Optimized Query Hook
 * ====================
 * Custom hook for optimized data fetching with caching, error handling, and loading states.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedApiService } from '../services/enhancedApiService';
import { handleApiError } from '../utils/errorHandler';

export const useOptimizedQuery = (queryKey, queryFn, options = {}) => {
  const {
    enabled = true,
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,  // 1 minute
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    onSettled
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Generate cache key
  const getCacheKey = useCallback(() => {
    return Array.isArray(queryKey) ? queryKey.join('_') : queryKey;
  }, [queryKey]);

  // Get cached data
  const getCachedData = useCallback(() => {
    const key = getCacheKey();
    const cached = cacheRef.current.get(key);
    
    if (cached) {
      const now = Date.now();
      const isExpired = now - cached.timestamp > cacheTime;
      const isStaleData = now - cached.timestamp > staleTime;
      
      if (!isExpired) {
        setIsStale(isStaleData);
        return cached.data;
      } else {
        cacheRef.current.delete(key);
      }
    }
    
    return null;
  }, [getCacheKey, cacheTime, staleTime]);

  // Set cached data
  const setCachedData = useCallback((newData) => {
    const key = getCacheKey();
    cacheRef.current.set(key, {
      data: newData,
      timestamp: Date.now()
    });
  }, [getCacheKey]);

  // Fetch data with retry logic
  const fetchData = useCallback(async (signal) => {
    let lastError;
    
    for (let attempt = 1; attempt <= retry; attempt++) {
      try {
        // Check cache first
        const cachedData = getCachedData();
        if (cachedData && !isStale) {
          setData(cachedData);
          setLoading(false);
          setError(null);
          onSuccess?.(cachedData);
          return;
        }

        // Fetch fresh data
        const result = await queryFn(signal);
        
        // Update cache
        setCachedData(result);
        
        // Update state
        setData(result);
        setLoading(false);
        setError(null);
        setIsStale(false);
        
        onSuccess?.(result);
        return;
        
      } catch (err) {
        lastError = err;
        
        // Don't retry if it's an abort error
        if (err.name === 'AbortError') {
          break;
        }
        
        // Don't retry on certain error types
        if (err.response?.status === 401 || err.response?.status === 403) {
          break;
        }
        
        // Wait before retry
        if (attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    // All retries failed
    setError(lastError);
    setLoading(false);
    onError?.(lastError);
  }, [queryFn, retry, retryDelay, getCachedData, setCachedData, isStale, onSuccess, onError]);

  // Refetch function
  const refetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    
    fetchData(abortControllerRef.current.signal);
  }, [fetchData]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    const key = getCacheKey();
    cacheRef.current.delete(key);
    setIsStale(true);
  }, [getCacheKey]);

  // Effect for data fetching
  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      onSuccess?.(cachedData);
      return;
    }

    // Fetch data
    refetch();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, getCacheKey, refetch, onSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    isStale,
    refetch,
    invalidateCache
  };
};

// Predefined query hooks
export const useProducts = (params = {}, options = {}) => {
  return useOptimizedQuery(
    ['products', params],
    () => enhancedApiService.getProducts(params),
    options
  );
};

export const useOrders = (params = {}, options = {}) => {
  return useOptimizedQuery(
    ['orders', params],
    () => enhancedApiService.getOrders(params),
    options
  );
};

export const useProductAnalytics = (businessId, options = {}) => {
  return useOptimizedQuery(
    ['product-analytics', businessId],
    () => enhancedApiService.getProductAnalytics(businessId),
    {
      ...options,
      staleTime: 300000, // 5 minutes for analytics
      cacheTime: 600000  // 10 minutes
    }
  );
};

export const useOrderDashboardStats = (businessId, options = {}) => {
  return useOptimizedQuery(
    ['order-dashboard-stats', businessId],
    () => enhancedApiService.getOrderDashboardStats(businessId),
    {
      ...options,
      staleTime: 300000, // 5 minutes for stats
      cacheTime: 600000  // 10 minutes
    }
  );
};

