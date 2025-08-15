import React from 'react';

const OrderFilters = ({ statusFilter, setStatusFilter, filteredOrders, orders }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <select
          className="block px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_production">In Production</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Delivered</option>
        </select>
      </div>
      <div className="text-right text-sm text-gray-500 flex items-center justify-end">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  );
};

export default OrderFilters;

