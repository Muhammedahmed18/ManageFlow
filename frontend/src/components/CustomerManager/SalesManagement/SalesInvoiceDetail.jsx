import React, { useState } from 'react';
import { X, Download, FileText, User, Calendar, DollarSign, MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../../../utils/salesUtils';
import { downloadInvoicePDF } from '../../../services/invoiceService';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const SalesInvoiceDetail = ({ isOpen, onClose, invoice, colors, onRefresh }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showPaidConfirmation, setShowPaidConfirmation] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      console.log('🔄 SalesInvoiceDetail: Downloading invoice:', invoice.invoice_number);
      
      // Use the invoice service to download the PDF
      const pdfData = await downloadInvoicePDF(invoice.id);
      
      // Create a blob from the response data
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoice.invoice_number}.pdf`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Invoice ${invoice.invoice_number} downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setIsMarkingPaid(true);
      console.log('🔄 SalesInvoiceDetail: Marking invoice as paid:', invoice.invoice_number);
      await api.patch(`/management/invoices/${invoice.id}/change_status/`, {
        status: 'paid'
      });
      toast.success(`Invoice ${invoice.invoice_number} marked as paid successfully!`);
      if (onRefresh) {
        await onRefresh();
      }
      onClose();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to mark invoice as paid';
      toast.error(errorMessage);
    } finally {
      setIsMarkingPaid(false);
      setShowPaidConfirmation(false);
    }
  };

  const confirmMarkAsPaid = () => {
    setShowPaidConfirmation(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = getStatusColor(status);
    const statusIcon = getStatusIcon(status);
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors}`}>
        {statusIcon} {status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '✅';
      case 'pending':
        return '⏳';
      case 'overdue':
        return '⚠️';
      case 'draft':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Invoice #{invoice.invoice_number}
              </h2>
                             <div className="flex items-center space-x-2 mt-1">
                 <span className="text-gray-600">
                   {getStatusBadge(invoice.status)}
                 </span>
               </div>
            </div>
                         <div className="flex items-center space-x-3">
               {/* Mark as Paid button - only show for pending invoices */}
               {invoice.status === 'pending' && (
                 <button
                   onClick={confirmMarkAsPaid}
                   disabled={isMarkingPaid}
                   className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                 >
                   <CheckCircle className="w-4 h-4 mr-2" />
                   {isMarkingPaid ? 'Marking...' : 'Mark as Paid'}
                 </button>
               )}
               
               <button
                 onClick={handleDownload}
                 disabled={isDownloading}
                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
               >
                 <Download className="w-4 h-4 mr-2" />
                 {isDownloading ? 'Downloading...' : 'Download'}
               </button>
               <button
                 onClick={onClose}
                 className="text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <X size={24} />
               </button>
             </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Invoice Details
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Date:</span> {formatDate(invoice.invoice_date)}</p>
                {invoice.due_date && (
                  <p><span className="font-medium">Due Date:</span> {formatDate(invoice.due_date)}</p>
                )}
                <p><span className="font-medium">Status:</span> {invoice.status}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Bill To
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{invoice.recipient_name}</p>
                {invoice.recipient_email && (
                  <p className="flex items-center text-gray-600">
                    <Mail className="w-3 h-3 mr-1" />
                    {invoice.recipient_email}
                  </p>
                )}
                {invoice.recipient_phone && (
                  <p className="flex items-center text-gray-600">
                    <Phone className="w-3 h-3 mr-1" />
                    {invoice.recipient_phone}
                  </p>
                )}
                {invoice.recipient_address && (
                  <p className="flex items-start text-gray-600">
                    <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{invoice.recipient_address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Summary
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Subtotal:</span> {formatCurrency(invoice.subtotal)}</p>
                {invoice.tax_amount > 0 && (
                  <p><span className="font-medium">Tax ({invoice.tax_percentage}%):</span> {formatCurrency(invoice.tax_amount)}</p>
                )}
                <p className="font-bold text-lg"><span>Total:</span> {formatCurrency(invoice.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoice Items
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Item
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Description
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Quantity
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Unit Price
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          {item.description || '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(item.total_price || item.total)}
                        </td>
                      </tr>
                    ))
                  ) : invoice.line_items && invoice.line_items.length > 0 ? (
                    invoice.line_items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                          {item.product_name || item.description || 'Product'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          {item.description || '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(item.amount || (item.quantity * item.unit_price))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="border border-gray-200 px-4 py-3 text-sm text-gray-500 text-center">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({invoice.tax_percentage}%):</span>
                    <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  {/* Only show Balance Due if invoice is not paid */}
                  {invoice.status !== 'paid' && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="font-medium text-red-600">Balance Due:</span>
                      <span className="font-medium text-red-600">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  )}
                  {/* Show Paid status if invoice is paid */}
                  {invoice.status === 'paid' && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="font-medium text-green-600">Status:</span>
                      <span className="font-medium text-green-600">Paid</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Instructions</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Please make payment within {invoice.due_date ? formatDate(invoice.due_date) : '30 days'} of the invoice date.
                For any questions regarding this invoice, please contact us.
              </p>
            </div>
          </div>
                 </div>
       </div>
       
       {/* Confirmation Dialog */}
       {showPaidConfirmation && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
           <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">
               Mark Invoice as Paid
             </h3>
             <p className="text-gray-600 mb-6">
               Are you sure you want to mark invoice #{invoice.invoice_number} as paid? 
               This action cannot be undone.
             </p>
             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => setShowPaidConfirmation(false)}
                 className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={handleMarkAsPaid}
                 disabled={isMarkingPaid}
                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
               >
                 {isMarkingPaid ? 'Marking...' : 'Confirm'}
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default SalesInvoiceDetail;
