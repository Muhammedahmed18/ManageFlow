/**
 * Enhanced Error Handling Utilities
 * =================================
 * Centralized error handling for the frontend application.
 */

// Error types for consistent handling
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Parse API error response and return structured error object
 */
export const parseApiError = (error) => {
  const errorObj = {
    type: ERROR_TYPES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'An unexpected error occurred',
    details: null,
    statusCode: null,
    timestamp: new Date().toISOString()
  };

  if (!error) {
    return errorObj;
  }

  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;
    errorObj.statusCode = status;

    // Determine error type based on status code
    if (status === 401) {
      errorObj.type = ERROR_TYPES.AUTHENTICATION;
      errorObj.severity = ERROR_SEVERITY.HIGH;
      errorObj.message = data?.detail || 'Authentication failed';
    } else if (status === 403) {
      errorObj.type = ERROR_TYPES.AUTHORIZATION;
      errorObj.severity = ERROR_SEVERITY.HIGH;
      errorObj.message = data?.detail || 'Access denied';
    } else if (status === 400) {
      errorObj.type = ERROR_TYPES.VALIDATION;
      errorObj.severity = ERROR_SEVERITY.MEDIUM;
      errorObj.message = data?.detail || 'Invalid request';
      errorObj.details = data;
    } else if (status === 429) {
      errorObj.type = ERROR_TYPES.RATE_LIMIT;
      errorObj.severity = ERROR_SEVERITY.MEDIUM;
      errorObj.message = 'Too many requests. Please wait before trying again.';
      errorObj.details = data;
    } else if (status >= 500) {
      errorObj.type = ERROR_TYPES.SERVER;
      errorObj.severity = ERROR_SEVERITY.HIGH;
      errorObj.message = 'Server error. Please try again later.';
      errorObj.details = data;
    } else {
      errorObj.message = data?.detail || `HTTP ${status} error`;
      errorObj.details = data;
    }
  } else if (error.request) {
    // Network error
    errorObj.type = ERROR_TYPES.NETWORK;
    errorObj.severity = ERROR_SEVERITY.HIGH;
    errorObj.message = 'Network error. Please check your connection.';
  } else {
    // Other errors
    errorObj.message = error.message || 'An unexpected error occurred';
  }

  return errorObj;
};

/**
 * Handle API errors with appropriate user feedback
 */
export const handleApiError = (error, context = '') => {
  const parsedError = parseApiError(error);
  
  // Log error for debugging
  console.error(`API Error [${context}]:`, {
    type: parsedError.type,
    message: parsedError.message,
    statusCode: parsedError.statusCode,
    details: parsedError.details,
    timestamp: parsedError.timestamp
  });

  // Handle critical errors
  if (parsedError.severity === ERROR_SEVERITY.CRITICAL) {
    // Redirect to error page or show critical error modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showCriticalError', { 
        detail: parsedError 
      }));
    }
  }

  // Handle authentication errors
  if (parsedError.type === ERROR_TYPES.AUTHENTICATION) {
    // Clear session and redirect to login
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.setItem("loginRedirectMessage", parsedError.message);
      window.location.href = "/login";
    }
  }

  // Show user-friendly notification
  if (typeof window !== 'undefined') {
    const notificationType = parsedError.severity === ERROR_SEVERITY.HIGH ? 'error' : 'warning';
    window.dispatchEvent(new CustomEvent('showNotification', { 
      detail: { 
        type: notificationType, 
        message: parsedError.message,
        duration: parsedError.type === ERROR_TYPES.RATE_LIMIT ? 10000 : 5000
      } 
    }));
  }

  return parsedError;
};

/**
 * Validate form data and return validation errors
 */
export const validateFormData = (data, validationRules) => {
  const errors = {};

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = data[field];
    
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
      continue;
    }

    if (value && rules.minLength && value.toString().length < rules.minLength) {
      errors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} must be at least ${rules.minLength} characters`;
    }

    if (value && rules.maxLength && value.toString().length > rules.maxLength) {
      errors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} cannot exceed ${rules.maxLength} characters`;
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} format is invalid`;
    }

    if (value && rules.custom) {
      const customError = rules.custom(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return errors;
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Debounce function to limit API calls
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Retry function for failed API calls
 */
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const parsedError = parseApiError(error);
      
      // Don't retry on certain error types
      if (parsedError.type === ERROR_TYPES.AUTHENTICATION || 
          parsedError.type === ERROR_TYPES.AUTHORIZATION ||
          parsedError.type === ERROR_TYPES.VALIDATION) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.detail) {
    return error.detail;
  }

  return 'An unexpected error occurred';
};

