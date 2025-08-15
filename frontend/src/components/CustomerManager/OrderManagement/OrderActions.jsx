import React from 'react';
import { 
  FiDownload, 
  FiEdit2, 
  FiTrash2 
} from "react-icons/fi";
import { FaCheck } from "react-icons/fa";
import { canEditOrder } from '../../../utils/customerOrderUtils.jsx';
import { generateCustomerOrderPDF } from '../../../services/customerPdfGenerator';
import toast from 'react-hot-toast';

const OrderActions = ({ 
  order, 
  onEdit, 
  onDelete, 
  onConfirmDelivery 
}) => {
  const handleDownloadPDF = async () => {
    try {
      await generateCustomerOrderPDF(order);
      toast.success("Professional order report generated successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Download PDF Button */}
      <button
        onClick={handleDownloadPDF}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        title="Download PDF"
      >
        <FiDownload className="w-5 h-5" />
      </button>

      {/* Edit Button */}
      {canEditOrder(order.status) && (
        <button
          onClick={() => onEdit(order)}
          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          title="Edit Order"
        >
          <FiEdit2 className="w-5 h-5" />
        </button>
      )}

      {/* Delete Button */}
      {canEditOrder(order.status) && (
        <button
          onClick={() => onDelete(order)}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Delete Order"
        >
          <FiTrash2 className="w-5 h-5" />
        </button>
      )}

      {/* Confirm Delivery Button */}
      {order.status === "shipped" && (
        <button
          onClick={() => onConfirmDelivery(order)}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          title="Confirm Delivery"
        >
          <FaCheck className="inline mr-2" />
          Confirm Delivery
        </button>
      )}
    </div>
  );
};

export default OrderActions;

