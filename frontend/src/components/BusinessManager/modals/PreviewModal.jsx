import React from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const PreviewModal = ({ previewItem, setPreviewItem, setShowPreview, colors }) => {
  return (
    <AnimatePresence>
      {previewItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
                {previewItem.name ? `Template Preview: ${previewItem.name}` : 'Preview Item'}
              </h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewItem(null);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {previewItem.fields?.length > 0 ? (
                previewItem.fields.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} <span className="text-xs text-gray-500">({field.type})</span>
                    </label>

                    {field.type === 'currency' ? (
                    <p className="text-sm text-gray-700 font-medium">
                      Symbol: {field.currency_symbol || '$'}
                    </p>
                  ) : field.options?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {field.options.map((opt, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 border border-gray-200 rounded-full px-3 py-1"
                        >
                          {opt.value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No options</p>
                  )}

                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No fields available for preview.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;
