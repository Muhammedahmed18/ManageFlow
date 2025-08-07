import React, { useState } from 'react';
import { Search, Package, Filter } from 'lucide-react';

const ProductSelectionStep = ({ products, onProductSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories
  const categories = ['all', ...new Set(products.map(product => product.category?.name).filter(Boolean))];

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product) => {
    onProductSelect(product);
  };

  return (
    <div className="p-6">
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 transition-colors"
          />
        </div>
        
        <div className="relative md:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg focus:border-[#343A40] focus:ring-1 focus:ring-[#343A40]/20 appearance-none transition-colors"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto text-[#ADB5BD] w-12 h-12 mb-4" />
          <h3 className="text-[#495057] font-medium mb-1">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No products found' 
              : 'No products available'}
          </h3>
          <p className="text-[#6C757D] text-sm">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search'
              : 'Products will appear here when added'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg overflow-hidden hover:border-[#343A40] hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="aspect-square bg-[#E9ECEF] flex items-center justify-center">
                  {product.image_url || (product.image ? `${window.location.origin}${product.image}` : null) ? (
                    <img
                      src={product.image_url || `${window.location.origin}${product.image}`}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to package icon if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <Package className={`w-10 h-10 text-[#ADB5BD] ${product.image_url || (product.image ? `${window.location.origin}${product.image}` : null) ? 'hidden' : ''}`} />
                </div>
                <div className="p-4">
                  <h3 className="text-[#343A40] font-medium text-sm truncate">
                    {product.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-[#6C757D] text-sm">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </>
      )}
    </div>
  );
};

export default ProductSelectionStep; 