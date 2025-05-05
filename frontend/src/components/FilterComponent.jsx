import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';

const FilterComponent = ({ data, filterFields, onFilter }) => {
  const [filters, setFilters] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilter({});
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowFilterPanel(!showFilterPanel)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        <Filter size={16} />
        Filters
        {Object.keys(filters).length > 0 && (
          <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {showFilterPanel && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filters</h3>
            <button onClick={() => setShowFilterPanel(false)}>
              <X size={16} />
            </button>
          </div>

          {filterFields.map((field) => (
            <div key={field.key} className="mb-4">
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={filters[field.key] || ''}
                onChange={(e) => handleFilterChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder={`Filter by ${field.label}`}
              />
            </div>
          ))}

          <div className="flex justify-between mt-4">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all
            </button>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterComponent;