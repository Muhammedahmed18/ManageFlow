import React from 'react';
import { Download } from 'lucide-react';
import { downloadPDF } from '../../../services/pdfGenerator';
import toast from 'react-hot-toast';

const OrderActions = ({ order }) => {
  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(order);
      toast.success("Order PDF downloaded successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownloadPDF}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        title="Download PDF"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};

export default OrderActions;

