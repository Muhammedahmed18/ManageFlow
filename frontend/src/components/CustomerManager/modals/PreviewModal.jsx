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
              {/* Template Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    previewItem.status === 'active'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`mr-1.5 w-2 h-2 rounded-full ${
                      previewItem.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                    }`}></span>
                    {previewItem.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Fields:</span>
                  <span className="text-sm text-gray-600">{previewItem.fields?.length || 0} fields</span>
                </div>
                {previewItem.created_at && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">Created:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(previewItem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Fields Section */}
              <div>
                <h3 className="text-lg font-medium mb-3" style={{ color: colors.textDark }}>
                  Template Fields
                </h3>
                {previewItem.fields?.length > 0 ? (
                  <div className="space-y-4">
                    {previewItem.fields.map((field, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        {field.type === 'currency' && (
                          <p className="text-sm text-gray-600">
                            Currency Symbol: {field.currency_symbol || '$'}
                            {field.decimal_places && ` (${field.decimal_places} decimal places)`}
                          </p>
                        )}
                        
                        {field.type === 'dropdown' && field.options?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Options:</p>
                            <div className="flex flex-wrap gap-2">
                              {field.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-gray-100 border border-gray-200 rounded-full px-3 py-1"
                                >
                                  {opt.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {field.type === 'default_value' && field.default_value && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Default Value:</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                              <span className="text-sm font-medium text-blue-800">
                                {field.default_value}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No fields available for preview.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;
