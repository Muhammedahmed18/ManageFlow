// Optimization Summary Utility
// Tracks and reports optimization metrics and improvements

class OptimizationSummary {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitBlocks: 0,
      slowRequests: 0,
      batchedRequests: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
    
    this.improvements = [];
    this.warnings = [];
  }

  // Track cache performance
  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  // Track rate limiting
  trackRateLimitBlock() {
    this.metrics.rateLimitBlocks++;
  }

  // Track slow requests
  trackSlowRequest(duration) {
    this.metrics.slowRequests++;
    this.warnings.push({
      type: 'slow_request',
      duration: Math.round(duration),
      timestamp: new Date().toISOString()
    });
  }

  // Track batched requests
  trackBatchedRequest() {
    this.metrics.batchedRequests++;
  }

  // Track total requests
  trackRequest() {
    this.metrics.totalRequests++;
  }

  // Add improvement note
  addImprovement(improvement) {
    this.improvements.push({
      ...improvement,
      timestamp: new Date().toISOString()
    });
  }

  // Get cache hit rate
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total * 100).toFixed(1) : 0;
  }

  // Get rate limit percentage
  getRateLimitPercentage() {
    return this.metrics.totalRequests > 0 
      ? (this.metrics.rateLimitBlocks / this.metrics.totalRequests * 100).toFixed(1) 
      : 0;
  }

  // Get slow request percentage
  getSlowRequestPercentage() {
    return this.metrics.totalRequests > 0 
      ? (this.metrics.slowRequests / this.metrics.totalRequests * 100).toFixed(1) 
      : 0;
  }

  // Get uptime
  getUptime() {
    const uptime = Date.now() - this.metrics.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Generate summary report
  generateReport() {
    const cacheHitRate = this.getCacheHitRate();
    const rateLimitPercentage = this.getRateLimitPercentage();
    const slowRequestPercentage = this.getSlowRequestPercentage();
    const uptime = this.getUptime();

    return {
      summary: {
        uptime,
        totalRequests: this.metrics.totalRequests,
        cacheHitRate: `${cacheHitRate}%`,
        rateLimitPercentage: `${rateLimitPercentage}%`,
        slowRequestPercentage: `${slowRequestPercentage}%`,
        batchedRequests: this.metrics.batchedRequests
      },
      metrics: this.metrics,
      improvements: this.improvements,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
  }

  // Generate optimization recommendations
  generateRecommendations() {
    const recommendations = [];
    const cacheHitRate = parseFloat(this.getCacheHitRate());
    const rateLimitPercentage = parseFloat(this.getRateLimitPercentage());
    const slowRequestPercentage = parseFloat(this.getSlowRequestPercentage());

    if (cacheHitRate < 50) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        message: 'Cache hit rate is low. Consider increasing cache TTL or adding more cacheable endpoints.',
        impact: 'High'
      });
    }

    if (rateLimitPercentage > 5) {
      recommendations.push({
        type: 'rate_limiting',
        priority: 'high',
        message: 'High rate limiting detected. Consider implementing request batching or reducing API call frequency.',
        impact: 'High'
      });
    }

    if (slowRequestPercentage > 10) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'High percentage of slow requests. Consider optimizing backend queries or implementing caching.',
        impact: 'Medium'
      });
    }

    if (this.metrics.batchedRequests === 0) {
      recommendations.push({
        type: 'batching',
        priority: 'low',
        message: 'No batched requests detected. Consider implementing request batching for better performance.',
        impact: 'Low'
      });
    }

    return recommendations;
  }

  // Export data for analytics
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      report: this.generateReport(),
      rawMetrics: this.metrics
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitBlocks: 0,
      slowRequests: 0,
      batchedRequests: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
    this.improvements = [];
    this.warnings = [];
  }
}

// Global optimization summary instance
const optimizationSummary = new OptimizationSummary();

// Auto-export metrics every 5 minutes
setInterval(() => {
  const data = optimizationSummary.exportData();
  console.log('Optimization Summary:', data.report.summary);
  
  // Send to analytics if needed
  if (window.gtag) {
    window.gtag('event', 'optimization_metrics', {
      cache_hit_rate: data.report.summary.cacheHitRate,
      rate_limit_percentage: data.report.summary.rateLimitPercentage,
      slow_request_percentage: data.report.summary.slowRequestPercentage,
      total_requests: data.report.summary.totalRequests
    });
  }
}, 5 * 60 * 1000); // 5 minutes

export default optimizationSummary;
