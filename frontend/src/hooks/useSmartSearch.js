import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDebouncedApi } from './useDebouncedApi';
import apiCache from '../utils/apiCache';

// Smart Search Hook
// Provides debounced search with caching and intelligent result handling

export const useSmartSearch = (searchEndpoint, options = {}) => {
  const {
    debounceDelay = 500, // Debounce delay in milliseconds
    minQueryLength = 2, // Minimum characters before searching
    maxResults = 50, // Maximum results to return
    enableCache = true,
    cacheTTL = 10 * 60 * 1000, // 10 minutes cache
    enableLocalSearch = false, // Enable local filtering of cached results
    localSearchFields = [] // Fields to search locally
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const lastQueryRef = useRef('');

  // Debounced API call for search
  const { data: apiResults, loading: apiLoading, error: apiError } = useDebouncedApi(
    searchEndpoint,
    { q: query, limit: maxResults },
    debounceDelay,
    enableCache
  );

  // Check if we should perform search
  const shouldSearch = useMemo(() => {
    return query.length >= minQueryLength && query !== lastQueryRef.current;
  }, [query, minQueryLength]);

  // Update results when API returns data
  useEffect(() => {
    if (apiResults && shouldSearch) {
      setResults(apiResults.results || apiResults || []);
      lastQueryRef.current = query;
      
      // Update search history
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10);
        return newHistory;
      });
    }
  }, [apiResults, shouldSearch, query]);

  // Local search functionality
  const performLocalSearch = useCallback((searchQuery, data) => {
    if (!enableLocalSearch || !searchQuery || searchQuery.length < minQueryLength) {
      return data;
    }

    const queryLower = searchQuery.toLowerCase();
    return data.filter(item => {
      return localSearchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(queryLower);
      });
    });
  }, [enableLocalSearch, minQueryLength, localSearchFields]);

  // Update local results when results change
  useEffect(() => {
    if (enableLocalSearch && results.length > 0) {
      const filtered = performLocalSearch(query, results);
      setLocalResults(filtered);
    } else {
      setLocalResults(results);
    }
  }, [results, query, enableLocalSearch, performLocalSearch]);

  // Generate suggestions from search history
  useEffect(() => {
    if (query.length >= minQueryLength) {
      const matchingHistory = searchHistory
        .filter(hist => hist.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matchingHistory);
    } else {
      setSuggestions([]);
    }
  }, [query, searchHistory, minQueryLength]);

  // Search function
  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
    setIsSearching(true);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setLocalResults([]);
    setSuggestions([]);
    setIsSearching(false);
  }, []);

  // Get final results (local or API)
  const finalResults = useMemo(() => {
    return enableLocalSearch ? localResults : results;
  }, [enableLocalSearch, localResults, results]);

  // Check if currently searching
  const searching = isSearching || apiLoading;

  return {
    query,
    results: finalResults,
    suggestions,
    searchHistory,
    searching,
    error: apiError,
    search,
    clearSearch,
    shouldSearch,
    totalResults: finalResults.length
  };
};

// Advanced Search Hook with Multiple Endpoints
export const useMultiSearch = (endpoints, options = {}) => {
  const {
    debounceDelay = 500,
    minQueryLength = 2,
    enableCache = true,
    searchType = 'all' // 'all', 'products', 'orders', 'customers', etc.
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Perform search across multiple endpoints
  const performSearch = useCallback(async (searchQuery) => {
    if (searchQuery.length < minQueryLength) {
      setResults({});
      return;
    }

    setLoading(true);
    setErrors({});

    const searchPromises = Object.entries(endpoints).map(async ([key, endpoint]) => {
      try {
        // Check cache first
        const cacheKey = apiCache.generateKey(endpoint, { q: searchQuery });
        const cached = apiCache.get(cacheKey);
        
        if (cached) {
          return { key, data: cached };
        }

        // Make API call
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        // Cache the result
        apiCache.set(cacheKey, data);
        
        return { key, data };
      } catch (error) {
        console.error(`Search error for ${key}:`, error);
        return { key, error };
      }
    });

    try {
      const searchResults = await Promise.allSettled(searchPromises);
      
      const newResults = {};
      const newErrors = {};

      searchResults.forEach((result, index) => {
        const key = Object.keys(endpoints)[index];
        
        if (result.status === 'fulfilled' && !result.value.error) {
          newResults[key] = result.value.data;
        } else {
          newErrors[key] = result.reason || result.value?.error;
        }
      });

      setResults(newResults);
      setErrors(newErrors);
    } catch (error) {
      console.error('Multi-search error:', error);
    } finally {
      setLoading(false);
    }
  }, [endpoints, minQueryLength]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= minQueryLength) {
        performSearch(query);
      }
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [query, debounceDelay, minQueryLength, performSearch]);

  // Get filtered results based on search type
  const filteredResults = useMemo(() => {
    if (searchType === 'all') {
      return results;
    }
    
    return Object.entries(results).reduce((acc, [key, data]) => {
      if (key.includes(searchType)) {
        acc[key] = data;
      }
      return acc;
    }, {});
  }, [results, searchType]);

  return {
    query,
    results: filteredResults,
    loading,
    errors,
    search: setQuery,
    clearSearch: () => {
      setQuery('');
      setResults({});
      setErrors({});
    }
  };
};
