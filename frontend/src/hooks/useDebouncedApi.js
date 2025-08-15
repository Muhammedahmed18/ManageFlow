import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/authService';
import apiCache from '../utils/apiCache';

// Debounced API hook to prevent excessive requests
export const useDebouncedApi = (endpoint, params = {}, delay = 300, enableCache = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const cacheKey = apiCache.generateKey(endpoint, params);
    
    // Check cache first (unless force refresh)
    if (enableCache && !forceRefresh) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(endpoint, {
        params,
        signal: abortControllerRef.current.signal
      });

      // Cache the response
      if (enableCache) {
        apiCache.set(cacheKey, response.data);
      }

      setData(response.data);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return;
      }
      setError(err);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, enableCache]);

  const debouncedFetch = useCallback((forceRefresh = false) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      fetchData(forceRefresh);
    }, delay);
  }, [fetchData, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    fetchData: debouncedFetch,
    refresh: () => fetchData(true)
  };
};

// Hook for immediate API calls (no debouncing)
export const useApi = (endpoint, params = {}, enableCache = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const cacheKey = apiCache.generateKey(endpoint, params);
    
    // Check cache first (unless force refresh)
    if (enableCache && !forceRefresh) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(endpoint, {
        params,
        signal: abortControllerRef.current.signal
      });

      // Cache the response
      if (enableCache) {
        apiCache.set(cacheKey, response.data);
      }

      setData(response.data);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return;
      }
      setError(err);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, enableCache]);

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
    fetchData,
    refresh: () => fetchData(true)
  };
};
