import React, { useState } from 'react';
import { List, Calendar, Eye, Edit, Trash2, FolderTree, Table } from 'lucide-react';
import { motion } from 'framer-motion';
import CategoryExplorer from './CategoryExplorer';

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
  const [viewMode, setViewMode] = useState('table');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg" style={{ color: colors.textDark }}>
            Products
            {categoryFilter && viewMode === 'table' && (
              <span className="ml-2 text-sm font-normal" style={{ color: colors.textMedium }}>
                (Filtered by: {getCategoryPath(categoryFilter)})
              </span>
            )}
          </h2>
          
          <div className="flex space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode('table');
                  setCategoryFilter(null);
                }}
                className={`px-3 py-1 rounded-md flex items-center text-sm ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: viewMode === 'table' ? colors.primary : colors.textMedium }}
              >
                <Table size={16} className="mr-1.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('categories')}
                className={`px-3 py-1 rounded-md flex items-center text-sm ${viewMode === 'categories' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: viewMode === 'categories' ? colors.primary : colors.textMedium }}
              >
                <FolderTree size={16} className="mr-1.5" />
                Categories
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Created At</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.textMedium }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 transition-colors ${selectedProduct?.id === product.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: colors.textMedium }}>
                          {product.custom_id || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePreviewItem(product)}
                          className="font-medium text-left hover:underline"
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
                        <div className="flex items-center" style={{ color: colors.textMedium }}>
                          <Calendar size={14} className="mr-2" />
                          <span>{formatDate(product.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            style={{ color: colors.primary }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(product.id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ color: colors.error }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <List size={48} className="mx-auto mb-4" style={{ color: colors.light }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.textDark }}>
                {searchQuery || categoryFilter ? 'No matching products found' : 'No products found'}
              </h3>
              <p style={{ color: colors.textMedium }}>
                {searchQuery ? "Try different search terms or" : "Get started by"} creating your first product
              </p>
              <button
                onClick={handleAddClick}
                className="mt-4 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary }}
              >
                Add Product
              </button>
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
          />
        )}
      </div>
    </div>
  );
};

export default ProductManagement;