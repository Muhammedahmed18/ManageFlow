import { useState, useEffect, useCallback, useRef } from 'react';

// Performance Monitoring Hook
// Tracks API performance, memory usage, and identifies bottlenecks

export const usePerformanceMonitor = (options = {}) => {
  const {
    enableAPIMonitoring = true,
    enableMemoryMonitoring = true,
    enableRenderMonitoring = true,
    logToConsole = false,
    sendToAnalytics = false,
    threshold = {
      apiResponseTime: 2000, // 2 seconds
      memoryUsage: 50 * 1024 * 1024, // 50MB
      renderTime: 16 // 16ms (60fps)
    }
  } = options;

  const [metrics, setMetrics] = useState({
    apiCalls: 0,
    apiErrors: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    renderCount: 0,
    slowRenders: 0
  });

  const [warnings, setWarnings] = useState([]);
  const apiCallTimes = useRef(new Map());
  const renderStartTime = useRef(0);
  const memoryInterval = useRef(null);

  // Monitor API calls
  const monitorAPICall = useCallback((endpoint, startTime) => {
    if (!enableAPIMonitoring) return;

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    apiCallTimes.current.set(endpoint, duration);
    
    setMetrics(prev => ({
      ...prev,
      apiCalls: prev.apiCalls + 1,
      averageResponseTime: (prev.averageResponseTime * prev.apiCalls + duration) / (prev.apiCalls + 1)
    }));

    // Check for slow API calls
    if (duration > threshold.apiResponseTime) {
      const warning = {
        type: 'slow_api',
        endpoint,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      };
      
      setWarnings(prev => [...prev, warning]);
      
      if (logToConsole) {
        console.warn('Slow API call detected:', warning);
      }
    }
  }, [enableAPIMonitoring, threshold.apiResponseTime, logToConsole]);

  // Monitor API errors
  const monitorAPIError = useCallback((endpoint, error) => {
    if (!enableAPIMonitoring) return;

    setMetrics(prev => ({
      ...prev,
      apiErrors: prev.apiErrors + 1
    }));

    const warning = {
      type: 'api_error',
      endpoint,
      error: error.message || error,
      timestamp: new Date().toISOString()
    };

    setWarnings(prev => [...prev, warning]);
    
    if (logToConsole) {
      console.error('API Error detected:', warning);
    }
  }, [enableAPIMonitoring, logToConsole]);

  // Monitor memory usage
  useEffect(() => {
    if (!enableMemoryMonitoring || !navigator.memory) return;

    const checkMemory = () => {
      const memoryInfo = navigator.memory;
      const usedMemory = memoryInfo.usedJSHeapSize;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: usedMemory
      }));

      // Check for high memory usage
      if (usedMemory > threshold.memoryUsage) {
        const warning = {
          type: 'high_memory',
          usage: Math.round(usedMemory / 1024 / 1024),
          timestamp: new Date().toISOString()
        };

        setWarnings(prev => [...prev, warning]);
        
        if (logToConsole) {
          console.warn('High memory usage detected:', warning);
        }
      }
    };

    memoryInterval.current = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check

    return () => {
      if (memoryInterval.current) {
        clearInterval(memoryInterval.current);
      }
    };
  }, [enableMemoryMonitoring, threshold.memoryUsage, logToConsole]);

  // Monitor render performance
  useEffect(() => {
    if (!enableRenderMonitoring) return;

    const startRender = () => {
      renderStartTime.current = performance.now();
    };

    const endRender = () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderCount: prev.renderCount + 1,
        slowRenders: renderTime > threshold.renderTime ? prev.slowRenders + 1 : prev.slowRenders
      }));

      // Check for slow renders
      if (renderTime > threshold.renderTime) {
        const warning = {
          type: 'slow_render',
          renderTime: Math.round(renderTime),
          timestamp: new Date().toISOString()
        };

        setWarnings(prev => [...prev, warning]);
        
        if (logToConsole) {
          console.warn('Slow render detected:', warning);
        }
      }
    };

    // Monitor render start
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      startRender();
      return originalRequestAnimationFrame.call(this, () => {
        endRender();
        callback();
      });
    };

    return () => {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    };
  }, [enableRenderMonitoring, threshold.renderTime, logToConsole]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const apiSuccessRate = metrics.apiCalls > 0 
      ? ((metrics.apiCalls - metrics.apiErrors) / metrics.apiCalls * 100).toFixed(1)
      : 100;

    const renderPerformance = metrics.renderCount > 0
      ? ((metrics.renderCount - metrics.slowRenders) / metrics.renderCount * 100).toFixed(1)
      : 100;

    return {
      apiPerformance: {
        totalCalls: metrics.apiCalls,
        errors: metrics.apiErrors,
        successRate: `${apiSuccessRate}%`,
        averageResponseTime: `${Math.round(metrics.averageResponseTime)}ms`
      },
      renderPerformance: {
        totalRenders: metrics.renderCount,
        slowRenders: metrics.slowRenders,
        performance: `${renderPerformance}%`
      },
      memoryUsage: {
        current: `${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`,
        threshold: `${Math.round(threshold.memoryUsage / 1024 / 1024)}MB`
      },
      warnings: warnings.length
    };
  }, [metrics, threshold.memoryUsage, warnings]);

  // Clear warnings
  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  // Export metrics for analytics
  const exportMetrics = useCallback(() => {
    const summary = getPerformanceSummary();
    
    if (sendToAnalytics) {
      // Send to analytics service
      console.log('Sending metrics to analytics:', summary);
    }
    
    return summary;
  }, [getPerformanceSummary, sendToAnalytics]);

  return {
    metrics,
    warnings,
    getPerformanceSummary,
    clearWarnings,
    exportMetrics,
    monitorAPICall,
    monitorAPIError
  };
};

// Hook for monitoring specific component performance
export const useComponentPerformance = (componentName, options = {}) => {
  const {
    trackRenders = true,
    trackProps = false,
    logToConsole = false
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const propsRef = useRef({});

  useEffect(() => {
    if (!trackRenders) return;

    renderCount.current += 1;
    lastRenderTime.current = Date.now();

    if (logToConsole) {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  const trackPropsChange = useCallback((props) => {
    if (!trackProps) return;

    const changedProps = Object.keys(props).filter(key => 
      props[key] !== propsRef.current[key]
    );

    if (changedProps.length > 0 && logToConsole) {
      console.log(`${componentName} props changed:`, changedProps);
    }

    propsRef.current = props;
  }, [componentName, trackProps, logToConsole]);

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    trackPropsChange
  };
};
