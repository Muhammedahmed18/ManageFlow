import React from 'react';
import { formatDate } from '../../../utils/orderUtils.jsx';
import StatusDropdown from './StatusDropdown';
import OrderActions from './OrderActions';

const OrderTable = ({ 
  filteredOrders, 
  openDropdownId, 
  onDropdownOpen, 
  onDropdownChange, 
  onOrderClick 
}) => {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Order ID</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id} className="hover:bg-gray-100 transition">
              <td className="px-6 py-4">
                <button
                  onClick={() => onOrderClick(order)}
                  className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                >
                  {order.order_number || order.data?.order_id || order.id}
                </button>
              </td>
              <td className="px-6 py-4">{order.data?.product || 'N/A'}</td>
              <td className="px-6 py-4">{order.data?.customer || 'N/A'}</td>
              <td className="px-6 py-4">{formatDate(order.created_at)}</td>
              <td className="px-6 py-4">
                <StatusDropdown
                  order={order}
                  isOpen={openDropdownId === order.id}
                  onOpen={() => onDropdownOpen(order.id)}
                  onChange={status => onDropdownChange(order.id, status)}
                />
              </td>
              <td className="px-6 py-4">
                <OrderActions order={order} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;

