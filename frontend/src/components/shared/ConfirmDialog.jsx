import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Confirm Dialog Component
 * =======================
 * Reusable confirmation dialog with different types and actions.
 */

const ConfirmDialog = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  type = 'warning', // warning, danger, info, success
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  showCancel = true,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!loading && onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onCancel?.();
      onClose?.();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose?.();
    }
  };

  const getTypeStyles = () => {
    const styles = {
      warning: {
        icon: '⚠️',
        color: '#f39c12',
        bgColor: '#fef3cd',
        borderColor: '#ffeaa7'
      },
      danger: {
        icon: '🚨',
        color: '#e74c3c',
        bgColor: '#f8d7da',
        borderColor: '#f5c6cb'
      },
      info: {
        icon: 'ℹ️',
        color: '#3498db',
        bgColor: '#d1ecf1',
        borderColor: '#bee5eb'
      },
      success: {
        icon: '✅',
        color: '#27ae60',
        bgColor: '#d4edda',
        borderColor: '#c3e6cb'
      }
    };
    return styles[type] || styles.warning;
  };

  const typeStyles = getTypeStyles();

  return createPortal(
    <div className="confirm-dialog-overlay" onClick={handleBackdropClick}>
      <div className="confirm-dialog">
        <div className="dialog-header" style={{ borderColor: typeStyles.borderColor }}>
          <div className="dialog-icon" style={{ color: typeStyles.color }}>
            {typeStyles.icon}
          </div>
          <h3 className="dialog-title">{title}</h3>
          <button 
            className="close-button" 
            onClick={handleCancel}
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <div className="dialog-body">
          <p className="dialog-message">{message}</p>
        </div>
        
        <div className="dialog-footer">
          {showCancel && (
            <button
              className="cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={loading}
            style={{ backgroundColor: typeStyles.color }}
          >
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        .confirm-dialog {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          width: 90%;
          animation: slideIn 0.2s ease-out;
        }

        .dialog-header {
          display: flex;
          align-items: center;
          padding: 20px 20px 0;
          border-bottom: 1px solid;
        }

        .dialog-icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .dialog-title {
          margin: 0;
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #333;
        }

        .dialog-body {
          padding: 20px;
        }

        .dialog-message {
          margin: 0;
          color: #666;
          line-height: 1.5;
        }

        .dialog-footer {
          display: flex;
          gap: 12px;
          padding: 0 20px 20px;
          justify-content: flex-end;
        }

        .cancel-button,
        .confirm-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button {
          background: #f8f9fa;
          color: #666;
        }

        .cancel-button:hover:not(:disabled) {
          background: #e9ecef;
        }

        .confirm-button {
          background: #007bff;
          color: white;
        }

        .confirm-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .confirm-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-loading {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ConfirmDialog;

