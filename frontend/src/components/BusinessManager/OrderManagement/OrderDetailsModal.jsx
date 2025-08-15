import React from 'react';
import { X, Download } from 'lucide-react';
import { downloadPDF } from '../../../services/pdfGenerator';
import { getStatusBadge } from '../../../utils/orderUtils.jsx';
import StatusBadge from './StatusBadge';
import toast from 'react-hot-toast';

const OrderDetailsModal = ({ order, onClose }) => {
  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(order);
      toast.success("Order PDF downloaded successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Order Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Order No</p>
                  <p className="font-medium">{order.order_number || order.data?.order_id || order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{order.data?.product || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Return Date</p>
                  <p className="font-medium">{order.data?.return_date || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{order.data?.customer || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{order.data?.notes || "No notes"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Additional Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(order.data).map(([key, value]) => {
                if (!['order_id', 'product', 'return_date', 'customer', 'notes'].includes(key)) {
                  return (
                    <div key={key}>
                      <p className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</p>
                      <p className="font-medium">{value || "N/A"}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;

