import React, { useEffect, useMemo } from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductPreviewModal = ({ 
  product, 
  onClose,
  onEdit, 
  onDelete,
  colors // Assumes colors are passed down for consistency
}) => {
  if (!product) return null;

  // Safely compute imageSrc using memo to avoid unnecessary blob creation
  const imageSrc = useMemo(() => {
    if (
      product.image &&
      typeof product.image === 'object' &&
      product.image instanceof File
    ) {
      return URL.createObjectURL(product.image);
    }
    return product.image_url || (typeof product.image === 'string' ? product.image : null);
  }, [product.image, product.image_url]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-gray-100"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: colors.textDark }}>
              {product.name}
            </h2>
            {product.category && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.category.name || product.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Image */}
            <div className="lg:w-1/2 p-6 flex items-center justify-center bg-gray-50">
              {imageSrc ? (
                <div className="relative w-full h-full min-h-80 rounded-xl overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-64 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-gray-500">No image available</span>
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="lg:w-1/2 p-6 space-y-6">
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-100" style={{ color: colors.textDark }}>
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              {product.template?.fields?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-100" style={{ color: colors.textDark }}>
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.template.fields.map((field) => {
                      const fieldValue = product.field_values?.find(
                        (fv) => fv.field?.id === field.id
                      );

                      let displayValue = fieldValue?.value || '—';

                      if (field.type === 'boolean') {
                        displayValue = fieldValue?.value === 'true' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Not Available
                          </span>
                        );
                      } else if (field.type === 'currency') {
                        const currencySymbol = field.currency_symbol || '$';
                        displayValue = fieldValue?.value ? (
                          <span className="font-medium text-blue-600">
                            {`${currencySymbol}${parseFloat(fieldValue.value).toFixed(2)}`}
                          </span>
                        ) : '—';
                      }

                      return (
                        <div key={field.id} className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                            {field.label}
                          </h4>
                          <p className="text-sm font-medium text-gray-900">
                            {displayValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer with Edit and Delete buttons */}
        <div className="p-4 border-t border-gray-100 flex justify-end items-center bg-gray-50 space-x-3">
          {onEdit && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(product)} 
              className="px-6 py-3 rounded-full text-white font-semibold flex items-center shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: colors.accent }}
            >
              <Edit size={16} className="mr-2" />
              Edit
            </motion.button>
          )}
          {onDelete && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(product.id)} 
              className="px-6 py-3 rounded-full text-white font-semibold flex items-center shadow-sm transition-all duration-200 hover:shadow-md"
              style={{ backgroundColor: colors.error }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductPreviewModal; 