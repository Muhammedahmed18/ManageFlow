import React from 'react';
import { X, Download, FileText, User, Calendar, DollarSign, MapPin, Phone, Mail } from 'lucide-react';

const InvoicePreviewModal = ({ invoice, onClose, colors }) => {
  if (!invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    const statusIcon = {
      'draft': '📝',
      'pending': '⏳',
      'sent': '📤',
      'paid': '✅',
      'overdue': '⚠️',
      'cancelled': '❌'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || statusColors['draft']}`}>
        {statusIcon[status] || '📄'} {status}
      </span>
    );
  };

  const handleDownload = async () => {
    try {
      console.log('🔄 InvoicePreviewModal: Downloading invoice:', invoice.invoice_number);
      
      // Use the invoice service to download the PDF
      const { downloadInvoicePDF } = await import('../../../services/invoiceService');
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
      
      console.log('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Invoice #{invoice.invoice_number}
              </h2>
              <p className="text-gray-600 mt-1">
                {getStatusBadge(invoice.status)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
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
                {invoice.po_number && (
                  <p><span className="font-medium">PO Number:</span> {invoice.po_number}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Bill To
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{invoice.customer_name}</p>
                {invoice.bill_to && (
                  <p className="flex items-start text-gray-600">
                    <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{invoice.bill_to}</span>
                  </p>
                )}
                {invoice.contact_info && (
                  <p className="flex items-center text-gray-600">
                    <Phone className="w-3 h-3 mr-1" />
                    {invoice.contact_info}
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
                <p className="font-bold text-lg"><span>Total:</span> {formatCurrency(invoice.total_amount || invoice.amount)}</p>
                {invoice.advanced_paid > 0 && (
                  <p><span className="font-medium">Advanced Paid:</span> {formatCurrency(invoice.advanced_paid)}</p>
                )}
                {/* Only show Balance Due if invoice is not paid */}
                {invoice.status !== 'paid' && invoice.balance_due > 0 && (
                  <p><span className="font-medium text-red-600">Balance Due:</span> {formatCurrency(invoice.balance_due)}</p>
                )}
                {/* Show Paid status if invoice is paid */}
                {invoice.status === 'paid' && (
                  <p><span className="font-medium text-green-600">Status:</span> <span className="text-green-600">Paid</span></p>
                )}
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
                  {invoice.line_items && invoice.line_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {item.product_name || item.description || `Item ${index + 1}`}
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
                        {formatCurrency(item.total || item.amount)}
                      </td>
                    </tr>
                  ))}
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
                    <span>{formatCurrency(invoice.total_amount || invoice.amount)}</span>
                  </div>
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
          {invoice.payment_instructions && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Instructions</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {invoice.payment_instructions}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
