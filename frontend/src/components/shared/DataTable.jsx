import React, { useState, useEffect, useMemo } from 'react';
import { debounce } from '../../utils/errorHandler';

/**
 * Enhanced Data Table Component
 * ============================
 * Reusable data table with sorting, filtering, pagination, and performance optimization.
 */

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  onRowClick = null,
  onSelectionChange = null,
  searchable = true,
  sortable = true,
  selectable = false,
  pageSize = 20,
  className = '',
  emptyMessage = 'No data available'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 300),
    []
  );

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        if (value == null) return false;
        
        const searchValue = searchTerm.toLowerCase();
        const cellValue = String(value).toLowerCase();
        
        return cellValue.includes(searchValue);
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle row selection
  const handleRowSelection = (rowId, checked) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = paginatedData.map(row => row.id);
      setSelectedRows(new Set(allIds));
      onSelectionChange?.(allIds);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  // Reset selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
    setCurrentPage(1);
  }, [data]);

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (!sortable || sortConfig.key !== columnKey) {
      return <span className="sort-icon">↕</span>;
    }
    return (
      <span className="sort-icon">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className={`data-table ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            onChange={(e) => debouncedSearch(e.target.value)}
            defaultValue={searchTerm}
          />
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="data-table-table">
          <thead>
            <tr>
              {selectable && (
                <th>
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className={sortable ? 'sortable' : ''}
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                  {renderSortIcon(column.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading">
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr className="empty">
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={onRowClick ? 'clickable' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={(e) => handleRowSelection(row.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.key}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
      </div>

      <style jsx>{`
        .data-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .search-bar {
          padding: 16px;
          border-bottom: 1px solid #eee;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table-table th,
        .data-table-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .data-table-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .data-table-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .data-table-table th.sortable:hover {
          background: #e9ecef;
        }

        .sort-icon {
          margin-left: 8px;
          font-size: 12px;
        }

        .data-table-table tr.clickable:hover {
          background: #f8f9fa;
          cursor: pointer;
        }

        .data-table-table tr.loading,
        .data-table-table tr.empty {
          text-align: center;
          color: #666;
          font-style: italic;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          gap: 16px;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f8f9fa;
        }

        .pagination-info {
          font-size: 14px;
          color: #666;
        }

        .results-info {
          padding: 8px 16px;
          background: #f8f9fa;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default DataTable;

