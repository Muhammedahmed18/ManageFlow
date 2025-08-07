import React, { useState } from 'react';
import { X, FolderPlus, ChevronDown, ChevronRight, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const CategoryModal = ({
  businessId,
  categories = [],
  onClose,
  onSave,
  colors,
  initialCategory = null
}) => {
  const isEdit = !!initialCategory;
  const [name, setName] = useState(initialCategory?.name || '');
  const [errors, setErrors] = useState({});
  const [newSubcategoryParent, setNewSubcategoryParent] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const categoryData = {
      name: name.trim(),
      business: businessId
    };

    if (isEdit) {
      categoryData.id = initialCategory.id;
    }

    onSave(categoryData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
            {isEdit ? 'Edit Category' : newSubcategoryParent ? 'Add Subcategory' : 'Create New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {newSubcategoryParent && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center">
              <span className="text-sm font-medium" style={{ color: colors.primary }}>
                Adding to: {categories.find(c => c.id === newSubcategoryParent)?.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewSubcategoryParent(null);
                }}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800"
              >
                Change
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
              Category Name*
            </label>
            <input
              type="text"
              className={`w-full border rounded-lg px-4 py-2 ${errors.name ? 'border-red-500' : ''}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({...errors, name: ''});
              }}
              placeholder={newSubcategoryParent ? "e.g., Blue Lodge Aprons" : "e.g., Masonic Aprons"}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="pt-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white font-medium`}
              style={{ backgroundColor: colors.primary }}
            >
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CategoryModal;