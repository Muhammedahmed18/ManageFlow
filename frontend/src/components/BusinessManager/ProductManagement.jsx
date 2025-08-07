import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { List, Calendar } from 'lucide-react';
import ProductPreviewModal from './ProductPreviewModal';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const ProductManagement = ({
  products = [],
  categories = [],
  templates = [],
  searchQuery = '',
  handlePreviewItem,
  colors = {
    // Updated unified color scheme
    primary: '#1C2E4A',
    secondary: '#52677D',
    accent: '#0F1A2B',
    light: '#BDC4D4',
    cream: '#D1CFC9',
    textDark: '#1A202C',
    textMedium: '#4A5568',
    textLight: '#52677D',
    error: '#EF4444',
    warning: '#f59e0b',
    success: '#10B981',
    border: '#BDC4D4',
    background: '#FFFFFF'
  },
  businessId
}) => {
  const [previewProduct, setPreviewProduct] = useState(null);

  // Use products directly since search is handled elsewhere
  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const handlePreviewClick = (product) => {
    setPreviewProduct(product);
  };

  const handleClosePreview = () => {
    setPreviewProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.textDark }}>
                Products
              </h2>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: colors.border }}>
          {filteredProducts.length > 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: colors.border }}>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-opacity-50 transition-colors duration-200"
                    style={{ 
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = `${colors.cream}50`}
                    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium" style={{ color: colors.textMedium }}>
                        {product.custom_id || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                                              <button
                          onClick={() => handlePreviewClick(product)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            ) : (
              <div className="text-center py-16">
                <List size={64} className="mx-auto mb-6" style={{ color: colors.light }} />
                <h3 className="text-xl font-semibold mb-3" style={{ color: colors.textDark }}>
                  {searchQuery ? 'No matching products found' : 'No products found'}
                </h3>
                <p className="mb-6" style={{ color: colors.textMedium }}>
                  {searchQuery ? "Try different search terms" : "No products available"}
                </p>
              </div>
            )}
          </div>
        </div>

      {/* Product Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={handleClosePreview}
          colors={colors}
        />
      )}
    </div>
  );
};

export default ProductManagement;