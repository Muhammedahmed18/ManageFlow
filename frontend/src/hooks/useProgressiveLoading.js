import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useDebouncedApi';

// Progressive Loading Hook
// Loads data progressively to reduce initial load time and API calls

export const useProgressiveLoading = (endpoints, options = {}) => {
  const {
    initialLoad = 3, // Number of items to load initially
    loadMore = 5, // Number of items to load on each "load more"
    delay = 100, // Delay between progressive loads
    enableCache = true,
    autoLoad = false // Auto-load more when scrolling
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const loadingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Load data progressively
  const loadProgressively = useCallback(async (startIndex, count) => {
    if (loadingRef.current || startIndex >= endpoints.length) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const endIndex = Math.min(startIndex + count, endpoints.length);
      const batchEndpoints = endpoints.slice(startIndex, endIndex);

      // Load batch of endpoints
      const batchPromises = batchEndpoints.map(endpoint => {
        if (typeof endpoint === 'string') {
          return fetch(endpoint).then(res => res.json());
        }
        return endpoint;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Filter successful results
      const successfulResults = batchResults
        .map((result, index) => result.status === 'fulfilled' ? result.value : null)
        .filter(Boolean);

      setData(prev => [...prev, ...successfulResults]);
      setCurrentIndex(endIndex);
      setHasMore(endIndex < endpoints.length);

    } catch (error) {
      console.error('Progressive loading error:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [endpoints]);

  // Load more data
  const loadMoreData = useCallback(() => {
    if (!hasMore || loading) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      loadProgressively(currentIndex, loadMore);
    }, delay);
  }, [hasMore, loading, currentIndex, loadMore, delay, loadProgressively]);

  // Initialize progressive loading
  useEffect(() => {
    if (endpoints.length > 0) {
      loadProgressively(0, initialLoad);
    }
  }, [endpoints, initialLoad, loadProgressively]);

  // Auto-load on scroll (optional)
  useEffect(() => {
    if (!autoLoad) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      if (scrolledToBottom && hasMore && !loading) {
        loadMoreData();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoLoad, hasMore, loading, loadMoreData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    hasMore,
    loadMore: loadMoreData,
    refresh: () => {
      setData([]);
      setCurrentIndex(0);
      setHasMore(true);
      loadProgressively(0, initialLoad);
    }
  };
};

// Lazy Loading Hook for individual items
export const useLazyLoad = (endpoint, options = {}) => {
  const {
    threshold = 0.1, // Intersection observer threshold
    rootMargin = '50px', // Root margin for intersection observer
    enableCache = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  const loadedRef = useRef(false);

  const { fetchData } = useApi(endpoint, {}, enableCache);

  const loadData = useCallback(async () => {
    if (loadedRef.current || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData();
      setData(result);
      loadedRef.current = true;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, loading]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadedRef.current) {
          setIsVisible(true);
          loadData();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef.current);

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold, rootMargin, loadData]);

  return {
    data,
    loading,
    error,
    isVisible,
    elementRef,
    loadData
  };
};
