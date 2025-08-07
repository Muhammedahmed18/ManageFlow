import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const OrderSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSelectDefault, 
  colors,
  businessId
}) => {




  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDefaultSelect = () => {
    onSelectDefault();
    onClose();
  };



  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          style={{ borderColor: colors.border }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
            <h2 className="text-2xl font-bold text-gray-900">Choose Order Creation Method</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 mb-6 text-center">
              Select the order creation method that best suits your needs
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Order Form Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative cursor-pointer"
                onClick={handleDefaultSelect}
              >
                <div 
                  className="border-2 rounded-xl p-6 h-full transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }}
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ backgroundColor: colors.primary + '20' }}
                    >
                      <FileText size={32} style={{ color: colors.primary }} />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Default Order Form
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-600 flex-grow">
                      <p>• Create orders using the standard form interface</p>
                      <p>• Quick and simple order creation</p>
                      <p>• Best for routine orders</p>
                    </div>
                    
                    <div 
                      className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: colors.primary + '10',
                        color: colors.primary 
                      }}
                    >
                      Choose Default Form
                    </div>
                  </div>
                </div>
              </motion.div>


            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: colors.border }}>
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderSelectionModal; 