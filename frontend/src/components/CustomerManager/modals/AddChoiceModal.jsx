import React from 'react';
import { motion } from 'framer-motion';
import { FolderPlus, PackagePlus } from 'lucide-react';

const AddChoiceModal = ({ 
  onClose,
  onSelectCategory,
  onSelectProduct,
  colors,
  categoryOnlyMode = false
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
            Create New
          </h2>
        </div>

        <div className={`p-6 ${categoryOnlyMode ? 'grid grid-cols-1' : 'grid grid-cols-2'} gap-4`}>
          {/* Category Option */}
          <button
            onClick={onSelectCategory}
            className="p-4 border rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center"
            style={{ borderColor: colors.primary }}
          >
            <FolderPlus size={24} style={{ color: colors.primary }} className="mb-2" />
            <span style={{ color: colors.textDark }}>Category</span>
            <p className="text-xs mt-1" style={{ color: colors.textMedium }}>
              For grouping products
            </p>
          </button>

          {/* Product Option - Hidden in category only mode */}
          {!categoryOnlyMode && (
            <button
              onClick={onSelectProduct}
              className="p-4 border rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center"
              style={{ borderColor: colors.primary }}
            >
              <PackagePlus size={24} style={{ color: colors.primary }} className="mb-2" />
              <span style={{ color: colors.textDark }}>Product</span>
              <p className="text-xs mt-1" style={{ color: colors.textMedium }}>
                Add a sellable item
              </p>
            </button>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddChoiceModal; 