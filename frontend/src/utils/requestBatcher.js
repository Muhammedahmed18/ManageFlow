// Request Batching Utility
// Combines multiple API calls into single requests to reduce network overhead

class RequestBatcher {
  constructor() {
    this.batches = new Map();
    this.batchTimeout = 50; // 50ms batch window
    this.maxBatchSize = 10; // Maximum requests per batch
  }

  // Add request to batch
  addToBatch(batchKey, requestFn) {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        requests: [],
        timeout: null,
        promise: null
      });
    }

    const batch = this.batches.get(batchKey);
    
    return new Promise((resolve, reject) => {
      batch.requests.push({ requestFn, resolve, reject });
      
      // Clear existing timeout
      if (batch.timeout) {
        clearTimeout(batch.timeout);
      }
      
      // Set new timeout or execute immediately if batch is full
      if (batch.requests.length >= this.maxBatchSize) {
        this.executeBatch(batchKey);
      } else {
        batch.timeout = setTimeout(() => {
          this.executeBatch(batchKey);
        }, this.batchTimeout);
      }
    });
  }

  // Execute a batch of requests
  async executeBatch(batchKey) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;

    const requests = batch.requests;
    batch.requests = [];
    batch.timeout = null;

    try {
      // Execute all requests in parallel
      const results = await Promise.allSettled(
        requests.map(({ requestFn }) => requestFn())
      );

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const { resolve, reject } = requests[index];
        if (result.status === 'fulfilled') {
          resolve(result.value);
        } else {
          reject(result.reason);
        }
      });
    } catch (error) {
      // If batch execution fails, reject all requests
      requests.forEach(({ reject }) => reject(error));
    }
  }

  // Force execute all pending batches
  async flushAll() {
    const batchKeys = Array.from(this.batches.keys());
    await Promise.all(
      batchKeys.map(key => this.executeBatch(key))
    );
  }

  // Get batch status
  getStatus() {
    const status = {};
    for (const [key, batch] of this.batches.entries()) {
      status[key] = {
        pendingRequests: batch.requests.length,
        hasTimeout: !!batch.timeout
      };
    }
    return status;
  }
}

// Global batcher instance
const requestBatcher = new RequestBatcher();

// Batch decorator for API calls
export const withBatching = (requestFn, batchKey) => {
  return (...args) => {
    return requestBatcher.addToBatch(batchKey, () => requestFn(...args));
  };
};

// Utility for batching multiple API calls
export const batchApiCalls = async (apiCalls, batchKey = 'default') => {
  const promises = apiCalls.map(call => 
    requestBatcher.addToBatch(batchKey, call)
  );
  return Promise.all(promises);
};

export default requestBatcher;
