import React from 'react';
import { 
  FiPackage, 
  FiCalendar, 
  FiTruck, 
  FiCheckCircle, 
  FiClock, 
  FiArchive,
  FiInfo
} from "react-icons/fi";
import { FaCheck } from "react-icons/fa";
import { formatDate, getStatusBadge } from '../../../utils/customerOrderUtils.jsx';
import OrderActions from './OrderActions';

const OrderCard = ({ 
  order, 
  newOrderConfirmed, 
  onOrderClick, 
  onEdit, 
  onDelete, 
  onConfirmDelivery 
}) => {
  const getStatusBadgeInline = (status) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200"><FiClock className="mr-1.5 w-4 h-4" /> Pending</span>;
      case "in_production":
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><FiPackage className="mr-1.5 w-4 h-4" /> In Production</span>;
      case "shipped":
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"><FiTruck className="mr-1.5 w-4 h-4" /> Shipped</span>;
      case "completed":
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200"><FiCheckCircle className="mr-1.5 w-4 h-4" /> Delivered</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200"><FiArchive className="mr-1.5 w-4 h-4" /> {status}</span>;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 ${
        newOrderConfirmed === order.id.toString() ? "ring-2 ring-green-500" : ""
      }`}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center">
              <button
                onClick={() => onOrderClick(order)}
                className="text-lg font-semibold text-gray-800 hover:text-indigo-600 hover:underline cursor-pointer transition-colors duration-200 flex items-center"
              >
                Order # {order.order_number}
                <FiInfo className="ml-2 text-gray-400 hover:text-indigo-500 transition-colors" />
              </button>
              {newOrderConfirmed === order.id.toString() && (
                <span className="ml-2 flex items-center text-sm text-green-600">
                  <FaCheck className="mr-1" /> Order placed successfully
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <FiCalendar className="inline mr-1" />
              {formatDate(order.created_at)} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            {getStatusBadgeInline(order.status)}

            {/* Action Buttons */}
            <OrderActions
              order={order}
              onEdit={onEdit}
              onDelete={onDelete}
              onConfirmDelivery={onConfirmDelivery}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;

