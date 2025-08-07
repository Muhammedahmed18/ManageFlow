import React, { useState } from 'react';
import { Folder, ChevronDown, ChevronRight, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import ProductPreviewModal from '../CustomerManager/modals/ProductPreviewModal';
import AddChoiceModal from '../CustomerManager/modals/AddChoiceModal';
import CategoryModal from '../CustomerManager/modals/CategoryModal';
import ProductModal from '../CustomerManager/modals/ProductModal';
import api from '../../services/authService';

const CategoryExplorer = ({
  categories = [],
  products = [],
  templates = [],
  onEditProduct = () => {},
  onDeleteProduct = () => {},
  onAddProduct = () => {},
  onAddCategory = () => {},
  onDeleteCategory = () => {},
  onReloadCategories = () => {},
  colors = {
    primary: '#3b82f6',
    textDark: '#1f2937',
    textMedium: '#6b7280',
    error: '#ef4444',
    warning: '#f59e0b'
  },
  businessId = null
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [previewProduct, setPreviewProduct] = useState(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [subcategoryParent, setSubcategoryParent] = useState(null);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getCategoryProducts = (categoryId) => {
    return products.filter(product => product?.category?.id === categoryId) || [];
  };

  const getSubcategories = (parentId) => {
    return categories.filter(category => String(category?.parent) === String(parentId)) || [];
  };

  const handleAddClick = (category) => {
    setSelectedCategory(category);
    setShowChoiceModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };  

  const handleAddSubcategory = (category) => {
    setSubcategoryParent(category);
    setSubcategoryName('');
    setShowSubcategoryForm(true);
  };

  const handleAddProduct = (category) => {
    setSelectedCategory(category);
    setShowProductModal(true);
  };

  const handleSaveCategory = async (categoryData) => {
    setIsSaving(true);
    try {
      const { business, ...payload } = categoryData;
      await onAddCategory(payload);
      setShowCategoryModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error("Error adding category:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    setIsSaving(true);
    try {
      const { id, name, parent } = categoryData;
      const payload = { name };
      if (parent) payload.parent = parent;
  
      await api.put(`/product-categories/${id}/`, payload);
      await onReloadCategories();
  
      setShowCategoryModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error("Error updating category:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add the missing handleSaveProduct function
  const handleSaveProduct = async (productData) => {
    setIsSaving(true);
    try {
      await onAddProduct(productData);
      setShowProductModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubcategory = async () => {
    if (!subcategoryName.trim()) return;
    
    setIsSaving(true);
    try {
      const categoryData = {
        name: subcategoryName.trim(),
        parent: subcategoryParent?.id || null
      };
      await onAddCategory(categoryData);
      setShowSubcategoryForm(false);
      setSubcategoryParent(null);
    } catch (err) {
      console.error("Error adding subcategory:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category, force = false) => {
    setDeleteError(null);
    try {
      const result = await onDeleteCategory(category, force);
      if (result.success) {
        setDeleteConfirm(null);
      } else {
        setDeleteError(result);
      }
    } catch (err) {
      setDeleteError({
        error: "An unexpected error occurred. Please try again.",
        requiresForce: false
      });
      console.error("Error deleting category:", err);
    }
  };

  const renderCategory = (category, depth = 0) => {
    if (!category) return null;
    
    const subcategories = getSubcategories(category.id);
    const categoryProducts = getCategoryProducts(category.id);
    const hasContent = subcategories.length > 0 || categoryProducts.length > 0;
    const hasSubcategories = subcategories.length > 0;

    return (
      <div key={category.id} className={`ml-4 ${depth > 0 ? 'border-l-2 border-gray-200 pl-4' : ''}`}>
        <div 
          className={`flex items-center py-2 px-3 rounded-lg ${hasContent ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={() => hasContent && toggleCategoryExpand(category.id)}
        >
          {hasContent ? (
            <button className="mr-2 text-gray-500">
              {expandedCategories[category.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className="w-6"></span>
          )}
          
          <Folder size={18} className="mr-2" style={{ color: colors.primary }} />
          <span className="font-medium flex-1">{category.name}</span>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {hasSubcategories 
              ? `${subcategories.length} ${subcategories.length === 1 ? 'category' : 'categories'}` 
              : `${categoryProducts.length} ${categoryProducts.length === 1 ? 'product' : 'products'}`}
          </span>
          
          <div className="flex ml-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleEditCategory(category);
              }}
              className="p-1 rounded hover:bg-blue-50"
              style={{ color: colors.primary }}
              title="Edit category"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleAddClick(category);
              }}
              className="p-1 rounded hover:bg-blue-50"
              style={{ color: colors.primary }}
              title="Add subcategory or product"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(category);
              }}
              className="p-1 rounded hover:bg-red-50 ml-1"
              style={{ color: colors.error }}
              title="Delete category"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {expandedCategories[category.id] && (
          <div className="mt-2 space-y-3">
            {subcategories.map(subcategory => renderCategory(subcategory, depth + 1))}
            
            {categoryProducts.map(product => (
              <div key={product.id} className="ml-6 pl-4 py-2 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div 
                    className="cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewProduct(product);
                    }}
                  >
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span>SKU: {product.custom_id || product.id}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(product);
                      }}
                      className="p-1.5 rounded hover:bg-blue-50"
                      style={{ color: colors.primary }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProduct(product.id);
                      }}
                      className="p-1.5 rounded hover:bg-red-50"
                      style={{ color: colors.error }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCategories = () => {
    const rootCategories = categories.filter(c => !c.parent);
    if (rootCategories.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No categories found. Create your first category to get started.
        </div>
      );
    }
    return rootCategories.map(rootCategory => renderCategory(rootCategory));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
            Category Explorer
          </h2>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center px-3 py-1.5 text-sm rounded-md hover:bg-blue-50"
            style={{ color: colors.primary, border: `1px solid ${colors.primary}` }}
          >
            <Plus size={16} className="mr-1" />
            Add New
          </button>
        </div>
        
        {renderCategories()}
      </div>

      {/* Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal 
          previewItem={previewProduct}
          setPreviewItem={setPreviewProduct}
          setShowPreview={() => setPreviewProduct(null)}
          colors={colors}
        />
      )}

      {/* Add Choice Modal */}
      {showChoiceModal && (
        <AddChoiceModal
          onClose={() => setShowChoiceModal(false)}
          onSelectCategory={() => {
            setShowChoiceModal(false);
            if (selectedCategory) {
              handleAddSubcategory(selectedCategory);
            } else {
              setShowCategoryModal(true);
            }
          }}
          onSelectProduct={() => {
            setShowChoiceModal(false);
            handleAddProduct(selectedCategory);
          }}
          colors={colors}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          businessId={businessId}
          categories={categories}
          onClose={() => {
            setShowCategoryModal(false);
            setSelectedCategory(null);
          }}
          onSave={selectedCategory ? handleUpdateCategory : handleSaveCategory}
          colors={colors}
          initialCategory={selectedCategory}
        />
      )}

      {/* Subcategory Form Modal */}
      {showSubcategoryForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
                Add Subcategory
              </h2>
              <button
                onClick={() => setShowSubcategoryForm(false)}
                className="text-gray-500 hover:text-gray-800"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center">
                <span className="text-sm font-medium" style={{ color: colors.primary }}>
                  Adding to: {subcategoryParent?.name || 'Root'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSubcategoryForm(false)}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                  disabled={isSaving}
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textDark }}>
                  Category Name*
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="e.g., Blue Lodge Aprons"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowSubcategoryForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubcategory}
                disabled={!subcategoryName.trim() || isSaving}
                className={`px-5 py-2 rounded-lg text-white font-medium ${
                  !subcategoryName.trim() || isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: colors.primary }}
              >
                {isSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          businessId={businessId}
          categories={categories}
          templates={templates}
          initialCategory={selectedCategory}
          setShowAddForm={setShowProductModal}
          onCreateProduct={handleSaveProduct}
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          colors={colors}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold" style={{ color: colors.textDark }}>
                {deleteError?.requiresForce ? 'Confirm Force Delete' : 'Delete Category'}
              </h2>
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError(null);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="mb-4">
                {deleteError?.requiresForce 
                  ? 'This category contains:'
                  : 'Are you sure you want to delete:'}
              </p>
              
              <p className="font-semibold text-lg mb-4">"{deleteConfirm.name}"</p>

              {getCategoryProducts(deleteConfirm.id).length > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 rounded-lg flex items-start">
                  <AlertTriangle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      Contains {getCategoryProducts(deleteConfirm.id).length} products
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      These products will become uncategorized
                    </p>
                  </div>
                </div>
              )}

              {getSubcategories(deleteConfirm.id).length > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 rounded-lg flex items-start">
                  <AlertTriangle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      Contains {getSubcategories(deleteConfirm.id).length} subcategories
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      These will be permanently deleted
                    </p>
                  </div>
                </div>
              )}

              {deleteError?.requiresForce && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-700 font-medium flex items-start">
                    <AlertTriangle className="mt-0.5 mr-2 flex-shrink-0" />
                    <span>This action cannot be undone</span>
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              
              {deleteError?.requiresForce ? (
                <button
                  onClick={() => handleDeleteCategory(deleteConfirm, true)}
                  className="px-5 py-2 rounded-lg text-white font-medium hover:bg-red-800"
                  style={{ backgroundColor: colors.error }}
                >
                  Force Delete Anyway
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteCategory(deleteConfirm)}
                  className="px-5 py-2 rounded-lg text-white font-medium hover:bg-red-700"
                  style={{ backgroundColor: colors.error }}
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryExplorer;