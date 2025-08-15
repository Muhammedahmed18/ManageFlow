import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Notification System Component
 * ============================
 * Displays toast notifications for user feedback
 */

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleShowNotification = (event) => {
      const { type, message, duration = 5000 } = event.detail;
      addNotification(type, message, duration);
    };

    const handleShowCriticalError = (event) => {
      const { message } = event.detail;
      addNotification('error', message, 10000);
    };

    // Listen for notification events
    window.addEventListener('showNotification', handleShowNotification);
    window.addEventListener('showCriticalError', handleShowCriticalError);

    return () => {
      window.removeEventListener('showNotification', handleShowNotification);
      window.removeEventListener('showCriticalError', handleShowCriticalError);
    };
  }, []);

  const addNotification = (type, message, duration) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationStyles = (type) => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      maxWidth: '400px',
      wordWrap: 'break-word',
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };

    const typeStyles = {
      success: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      },
      error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb'
      },
      warning: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeaa7'
      },
      info: {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb'
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = (type) => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  };

  // Create portal to render notifications at the top level
  return createPortal(
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            ...getNotificationStyles(notification.type),
            top: `${20 + (index * 80)}px`,
            pointerEvents: 'auto'
          }}
          onClick={() => removeNotification(notification.id)}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {getIcon(notification.type)}
          </span>
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              opacity: 0.7,
              padding: '0',
              marginLeft: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.7';
            }}
          >
            ×
          </button>
        </div>
      ))}
      
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>,
    document.body
  );
};

export default NotificationSystem;

