import { useState, useEffect, useCallback, useRef } from 'react';

// Virtual Scrolling Hook
// Efficiently renders large lists by only rendering visible items

export const useVirtualScroll = (items, options = {}) => {
  const {
    itemHeight = 60, // Height of each item in pixels
    containerHeight = 400, // Height of the container
    overscan = 5, // Number of items to render outside viewport
    enableCache = true
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  const scrollTimeoutRef = useRef(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Calculate total height for scrollbar
  const totalHeight = items.length * itemHeight;

  // Calculate offset for positioning
  const offsetY = startIndex * itemHeight;

  // Handle scroll events with debouncing
  const handleScroll = useCallback((event) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setScrollTop(event.target.scrollTop);
    }, 16); // ~60fps
  }, []);

  // Set up scroll listener
  useEffect(() => {
    if (!containerRef) return;

    const container = containerRef;
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef, handleScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (!containerRef) return;

    const targetScrollTop = index * itemHeight;
    containerRef.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }, [containerRef, itemHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (!containerRef) return;

    containerRef.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [containerRef]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    scrollToItem,
    scrollToTop,
    setContainerRef,
    scrollTop
  };
};

// Virtual List Component Hook
export const useVirtualList = (items, options = {}) => {
  const {
    itemHeight = 60,
    containerHeight = 400,
    overscan = 5,
    enableInfiniteScroll = false,
    loadMoreThreshold = 100
  } = options;

  const [allItems, setAllItems] = useState(items);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const virtualScroll = useVirtualScroll(allItems, {
    itemHeight,
    containerHeight,
    overscan
  });

  // Load more items when scrolling near bottom
  const handleScroll = useCallback((event) => {
    if (!enableInfiniteScroll || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - loadMoreThreshold;

    if (isNearBottom) {
      // This would typically trigger loading more data
      // For now, we'll just set loading state
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [enableInfiniteScroll, loading, hasMore, loadMoreThreshold]);

  // Update items
  const updateItems = useCallback((newItems) => {
    setAllItems(newItems);
  }, []);

  // Add items
  const addItems = useCallback((newItems) => {
    setAllItems(prev => [...prev, ...newItems]);
  }, []);

  // Remove item
  const removeItem = useCallback((index) => {
    setAllItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update item
  const updateItem = useCallback((index, updatedItem) => {
    setAllItems(prev => prev.map((item, i) => i === index ? updatedItem : item));
  }, []);

  return {
    ...virtualScroll,
    items: allItems,
    loading,
    hasMore,
    updateItems,
    addItems,
    removeItem,
    updateItem,
    handleScroll
  };
};
