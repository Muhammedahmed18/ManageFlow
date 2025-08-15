/**
 * Performance Utilities
 * ====================
 * Performance monitoring and optimization utilities.
 */

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
  }

  // Start timing
  startTimer(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  // End timing
  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      // Log if duration is significant
      if (metric.duration > 100) {
        console.warn(`Performance: ${name} took ${metric.duration.toFixed(2)}ms`);
      }
      
      // Notify observers
      this.notifyObservers(name, metric);
    }
  }

  // Get metric
  getMetric(name) {
    return this.metrics.get(name);
  }

  // Add observer
  addObserver(name, callback) {
    if (!this.observers.has(name)) {
      this.observers.set(name, []);
    }
    this.observers.get(name).push(callback);
  }

  // Notify observers
  notifyObservers(name, metric) {
    const observers = this.observers.get(name);
    if (observers) {
      observers.forEach(callback => callback(metric));
    }
  }

  // Clear metrics
  clear() {
    this.metrics.clear();
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Debounce function with performance tracking
export const debounceWithTracking = (func, wait, name = 'debounced') => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      performanceMonitor.startTimer(name);
      func(...args);
      performanceMonitor.endTimer(name);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function with performance tracking
export const throttleWithTracking = (func, limit, name = 'throttled') => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      performanceMonitor.startTimer(name);
      func(...args);
      performanceMonitor.endTimer(name);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
};

// Component render performance
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return function PerformanceTrackedComponent(props) {
    const startTime = performance.now();
    
    const result = <WrappedComponent {...props} />;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 16) { // Longer than one frame
      console.warn(`Performance: ${componentName} render took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
};

// Image optimization
export const optimizeImage = (src, options = {}) => {
  const {
    width = 800,
    quality = 0.8,
    format = 'webp'
  } = options;

  // For now, return the original src
  // In production, you might use a CDN or image optimization service
  return src;
};

// Lazy loading utility
export const lazyLoad = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return function LazyWrapper(props) {
    return (
      <React.Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
};

// Virtual scrolling utility
export const createVirtualScroller = (items, itemHeight, containerHeight) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  
  return {
    getVisibleRange: (scrollTop) => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      return { startIndex, endIndex };
    },
    
    getVisibleItems: (scrollTop) => {
      const { startIndex, endIndex } = this.getVisibleRange(scrollTop);
      return items.slice(startIndex, endIndex);
    },
    
    getOffsetY: (index) => index * itemHeight,
    
    totalHeight
  };
};

// Bundle size monitoring
export const getBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  
  // In production, you might want to track bundle sizes
  return {
    main: 0, // Would be calculated in build process
    vendor: 0,
    total: 0
  };
};

// Network performance monitoring
export const monitorNetworkPerformance = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

// Export performance utilities
export default {
  PerformanceMonitor,
  performanceMonitor,
  debounceWithTracking,
  throttleWithTracking,
  getMemoryUsage,
  withPerformanceTracking,
  optimizeImage,
  lazyLoad,
  createVirtualScroller,
  getBundleSize,
  monitorNetworkPerformance
};

