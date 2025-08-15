import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Building, Users, X, CheckCircle, Download } from 'lucide-react';
import api from '../../services/authService';
import toast from 'react-hot-toast';
import InvoiceCreator from '../BusinessManager/modals/InvoiceCreator';
import InvoiceDetailModal from './modals/InvoiceDetailModal';

const PaymentManagement = ({ businessId, colors = {
  primary: '#1C2E4A',
  primaryLight: '#3A4D6B',
  textDark: '#1f2937',
  textMedium: '#6b7280',
  border: '#e5e7eb',
  cream: '#f5f5f4',
  light: '#9ca3af',
  error: '#ef4444'
} }) => {
  const [userRole, setUserRole] = useState('customer');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (businessId) {
      fetchInvoices();
    }
    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'customer');
  }, [businessId]);

  const fetchInvoices = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      // Fetch invoices - backend automatically filters out draft invoices for customers
      const response = await api.get(`/management/invoices/?business=${businessId}&invoice_type=manufacturer`);
      setInvoices(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setShowCreateInvoiceModal(true);
  };

  const handleInvoiceCreated = (newInvoice) => {
    // Add the new invoice to the list
    setInvoices(prev => [newInvoice, ...prev]);
    setShowCreateInvoiceModal(false);
    toast.success('Invoice created successfully!');
  };

  const handlePayClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };



  const handleQuickDownload = async (invoice) => {
    try {
      // This will trigger the download from the InvoiceDetailModal
      setSelectedInvoice(invoice);
      setShowInvoiceDetailModal(true);
      // The actual download will be handled by the modal
    } catch (error) {
      console.error('Error preparing download:', error);
      toast.error('Failed to prepare download');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      await api.patch(`/management/invoices/${selectedInvoice.id}/change_status/`, { status: 'paid' });
      toast.success('Invoice marked as paid successfully');
      fetchInvoices();
      setShowPaymentModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid');
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.business_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              {/* Show "New Payment" button for manufacturers */}
              {userRole === 'manufacturer' && (
                <button
                  onClick={handleCreateInvoice}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  New Payment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-4">
                No manufacturer invoices available yet.
              </p>
              {userRole === 'manufacturer' && (
                <button
                  onClick={handleCreateInvoice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Invoice
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice (Click to View)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manufacturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number || `INV-${invoice.id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(invoice.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.business_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(invoice.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickDownload(invoice)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {invoice.status === 'pending' && (
                            <button
                              onClick={() => handlePayClick(invoice)}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
                              title="Mark as Paid"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Invoice Creator Modal */}
      {showCreateInvoiceModal && (
        <InvoiceCreator
          isOpen={showCreateInvoiceModal}
          businessId={businessId}
          invoiceType="customer"
          onClose={() => setShowCreateInvoiceModal(false)}
          onSave={async (invoiceData) => {
            try {
              const response = await api.post('/management/invoices/', invoiceData);
              handleInvoiceCreated(response.data);
              setShowCreateInvoiceModal(false);
              toast.success('Invoice created successfully!');
            } catch (error) {
              console.error('Error creating invoice:', error);
              toast.error('Failed to create invoice');
            }
          }}
        />
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetailModal && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          businessId={businessId}
          onClose={() => {
            setShowInvoiceDetailModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Payment</h3>
              <button
                onClick={handleCancelPayment}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to mark this invoice as paid?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Invoice:</span>
                  <span className="text-sm text-gray-900">{selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Amount:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Due Date:</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedInvoice.due_date)}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelPayment}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement; 