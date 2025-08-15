import React from 'react';
import { FaCheck } from "react-icons/fa";

const DeliveryConfirmationModal = ({ orderToConfirm, onClose, onConfirm }) => {
  if (!orderToConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delivery</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <FaCheck className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <h4 className="text-lg font-medium text-gray-900">Order Delivered</h4>
              <p className="text-sm text-gray-500">Order #{orderToConfirm.order_number || orderToConfirm.data?.order_id || orderToConfirm.id}</p>
            </div>
          </div>
          <p className="text-gray-600">
            Please confirm that you have received your order. This will mark the order as delivered and complete the transaction.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmationModal;

