import React, { useState, useEffect } from 'react';
import { List, Calendar, Eye, Edit, Trash2, FolderTree, Table, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import CategoryExplorer from './CategoryExplorer';
import LoadingSpinner from '../shared/LoadingSpinner';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const ProductManagement = ({
  products = [],
  categories = [],
  templates = [],
  searchQuery = '',
  onEdit,
  onDelete,
  handlePreviewItem,
  setShowAddForm,
  selectedProduct,
  colors = {
    primary: '#1C2E4A',
    secondary: '#52677D',
    accent: '#0F1A2B',
    light: '#BDC4D4',
    cream: '#D1CFC9',
    textDark: '#1A202C',
    textMedium: '#4A5568',
    error: '#E53E3E',
    warning: '#f59e0b'
  },
  onCreateProduct,
  onCreateCategory,
  onDeleteCategory,
  onReloadCategories,
  businessId
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false when products are loaded
  useEffect(() => {
    setIsLoading(false);
  }, [products]);

  const [viewMode, setViewMode] = useState('table');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      (product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product?.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || product?.category?.id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryPath = (categoryId) => {
    if (!categoryId) return null;
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;

    let path = category.name;
    let parentId = category.parent;
    
    while (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent) {
        path = `${parent.name} > ${path}`;
        parentId = parent.parent;
      } else {
        break;
      }
    }
    
    return path;
  };

  const handleEditClick = (product) => {
    setIsEditMode(true);
    onEdit(product);
    setShowAddForm(true);
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setShowAddForm(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-xl shadow-sm border overflow-hidden" 
             style={{ backgroundColor: colors.background, borderColor: colors.border }}>
          <div className="p-6 border-b flex justify-between items-center" 
               style={{ borderColor: colors.border }}>
            <div className="flex items-center space-x-4">
              <h2 className="font-semibold text-xl" style={{ color: colors.textDark }}>
                {viewMode === 'categories' ? 'Category Explorer' : 'Product Catalog'}
                {categoryFilter && viewMode === 'table' && (
                  <span className="ml-2 text-sm font-normal" style={{ color: colors.textMedium }}>
                    (Filtered by: {getCategoryPath(categoryFilter)})
                  </span>
                )}
              </h2>

            </div>
            
            <div className="flex space-x-3">
              <div className="flex rounded-lg p-1" style={{ backgroundColor: colors.cream }}>
                <button
                  onClick={() => {
                    setViewMode('table');
                    setCategoryFilter(null);
                  }}
                  className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'shadow-sm' 
                      : 'hover:bg-white/50'
                  }`}
                  style={{ 
                    backgroundColor: viewMode === 'table' ? colors.background : 'transparent',
                    color: viewMode === 'table' ? colors.primary : colors.textMedium 
                  }}
                >
                  <Table size={16} className="mr-2" />
                  List View
                </button>
                <button
                  onClick={() => setViewMode('categories')}
                  className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200 ${
                    viewMode === 'categories' 
                      ? 'shadow-sm' 
                      : 'hover:bg-white/50'
                  }`}
                  style={{ 
                    backgroundColor: viewMode === 'categories' ? colors.background : 'transparent',
                    color: viewMode === 'categories' ? colors.primary : colors.textMedium 
                  }}
                >
                  <FolderTree size={16} className="mr-2" />
                  Category View
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'table' ? (
            filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: colors.cream }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" 
                          style={{ color: colors.textMedium }}>
                        SKU
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" 
                          style={{ color: colors.textMedium }}>
                        Product Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" 
                          style={{ color: colors.textMedium }}>
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" 
                          style={{ color: colors.textMedium }}>
                        Template
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" 
                          style={{ color: colors.textMedium }}>
                        Created At
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" 
                          style={{ color: colors.textMedium }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ divideColor: colors.border }}>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-opacity-50 transition-colors duration-200 ${
                          selectedProduct?.id === product.id ? 'bg-opacity-20' : ''
                        }`}
                        style={{ 
                          backgroundColor: selectedProduct?.id === product.id 
                            ? `${colors.light}30` 
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = `${colors.cream}50`}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 
                          selectedProduct?.id === product.id ? `${colors.light}30` : 'transparent'}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium" style={{ color: colors.textMedium }}>
                            {product.custom_id || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handlePreviewItem(product)}
                            className="font-semibold text-left hover:underline transition-colors duration-200"
                            style={{ color: colors.primary }}
                          >
                            {product.name}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm" style={{ color: colors.textMedium }}>
                            {product.category?.name || 'Uncategorized'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm" style={{ color: colors.textMedium }}>
                            {product.template?.name || 'No template'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm" style={{ color: colors.textMedium }}>
                            <Calendar size={14} className="mr-2" />
                            <span>{formatDate(product.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditClick(product)}
                              className="p-2 rounded-lg transition-all duration-200"
                              style={{ 
                                color: colors.primary,
                                ':hover': { backgroundColor: `${colors.light}30` }
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = `${colors.light}30`}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <Edit size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onDelete(product.id)}
                              className="p-2 rounded-lg transition-all duration-200"
                              style={{ 
                                color: colors.error,
                                ':hover': { backgroundColor: `${colors.error}20` }
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = `${colors.error}20`}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <List size={64} className="mx-auto mb-6" style={{ color: colors.light }} />
                <h3 className="text-xl font-semibold mb-3" style={{ color: colors.textDark }}>
                  {searchQuery || categoryFilter ? 'No matching products found' : 'No products found'}
                </h3>
                <p className="mb-6" style={{ color: colors.textMedium }}>
                  {searchQuery ? "Try different search terms or" : "Get started by"} creating your first product
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddClick}
                  className="px-6 py-3 rounded-xl text-white font-semibold hover:shadow-lg transition-all duration-200"
                  style={{ backgroundColor: colors.primary }}
                >
                  Add Product
                </motion.button>
              </div>
            )
          ) : (
            <CategoryExplorer
              categories={categories}
              products={products}
              templates={templates}
              onEditProduct={handleEditClick}
              onDeleteProduct={onDelete}
              onAddProduct={async (productData) => {
                try {
                  await onCreateProduct(productData);
                } catch (err) {
                  console.error("Error creating product:", err);
                }
              }}
              onAddCategory={async (categoryData) => {
                try {
                  await onCreateCategory(categoryData);
                } catch (err) {
                  console.error("Error creating category:", err);
                }
              }}
              onEditCategory={async (category) => {
                // Implement if needed
              }}
              onDeleteCategory={onDeleteCategory}
              onReloadCategories={onReloadCategories}
              colors={colors}
              businessId={businessId}
              categoryOnlyMode={true}
              showAddCategoryModal={showAddCategoryModal}
              setShowAddCategoryModal={setShowAddCategoryModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;