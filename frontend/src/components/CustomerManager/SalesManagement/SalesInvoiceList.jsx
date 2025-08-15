import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, FileText, Eye, Download, DollarSign, Calendar, User, ChevronDown, MoreVertical, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import InvoiceCreator from '../../BusinessManager/modals/InvoiceCreator';
import SalesInvoiceDetail from './SalesInvoiceDetail';
import api from '../../../services/authService';
import { downloadInvoicePDF } from '../../../services/invoiceService';
import toast from 'react-hot-toast';
import { formatCurrency, getStatusColor, getStatusIcon, formatDate } from '../../../utils/salesUtils';

const SalesInvoiceList = ({ 
  businessId, 
  salesInvoices, 
  endCustomers, 
  onRefresh, 
  colors,
  showInvoiceCreator,
  setShowInvoiceCreator,
  selectedEndCustomer,
  setSelectedEndCustomer,
  onCreateInvoice
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const getRevenueSummary = () => {
    const total = salesInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
    const paid = salesInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
    const pending = salesInvoices
      .filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);
    const overdue = salesInvoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0);

    return { total, paid, pending, overdue };
  };

  const revenueSummary = getRevenueSummary();

  const filteredInvoices = useMemo(() => {
    let filtered = [...salesInvoices];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        switch (dateFilter) {
          case 'last30':
            return invoiceDate >= thirtyDaysAgo;
          case 'last90':
            return invoiceDate >= ninetyDaysAgo;
          case 'thisYear':
            return invoiceDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.invoice_date);
          bValue = new Date(b.invoice_date);
          break;
        case 'amount':
          aValue = parseFloat(a.total_amount || 0);
          bValue = parseFloat(b.total_amount || 0);
          break;
        case 'number':
          aValue = a.invoice_number;
          bValue = b.invoice_number;
          break;
        case 'customer':
          aValue = a.recipient_name;
          bValue = b.recipient_name;
          break;
        default:
          aValue = new Date(a.invoice_date);
          bValue = new Date(b.invoice_date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [salesInvoices, searchQuery, statusFilter, dateFilter, sortBy, sortOrder]);

  const handleCreateInvoice = async (invoiceData) => {
    console.log('🔄 SalesInvoiceList: handleCreateInvoice called with:', invoiceData);
    if (onCreateInvoice) {
      try {
        await onCreateInvoice(invoiceData);
        console.log('🔄 SalesInvoiceList: onCreateInvoice completed successfully');
      } catch (error) {
        console.error('🔄 SalesInvoiceList: Error in onCreateInvoice:', error);
        // Don't re-throw the error since the invoice was already created
      }
    }
  };

  const handleCreateInvoiceForCustomer = (endCustomer) => {
    setSelectedEndCustomer(endCustomer);
    setShowInvoiceCreator(true);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      console.log('🔄 SalesInvoiceList: Downloading invoice:', invoice.invoice_number);
      
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
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      setLoading(true);
      await api.patch(`/management/invoices/${invoice.id}/change_status/`, {
        status: newStatus
      });
      
      toast.success(`Invoice status changed to ${newStatus}`);
      
      // Refresh the invoice list
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error changing invoice status:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to change invoice status';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status?.toLowerCase()) {
      case 'paid':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-3 h-3 mr-1" />Paid</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'overdue':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}><AlertCircle className="w-3 h-3 mr-1" />Overdue</span>;
      case 'draft':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}><FileText className="w-3 h-3 mr-1" />Draft</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}><FileText className="w-3 h-3 mr-1" />{status}</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Header - Matching End Customer style */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: colors.primary }}>
            Sales Invoices
          </h2>
          <p className="text-sm" style={{ color: colors.textLight }}>
            Manage and track all your sales invoices
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* End Customer Selection Dropdown */}
          <div className="relative">
            <select
              value={selectedEndCustomer?.id || ''}
              onChange={(e) => {
                const customerId = e.target.value;
                const customer = endCustomers.find(c => c.id.toString() === customerId);
                setSelectedEndCustomer(customer || null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select End Customer</option>
              {endCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
        </div>
        <button
          onClick={() => setShowInvoiceCreator(true)}
            disabled={!selectedEndCustomer}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
            <span>
              {selectedEndCustomer 
                ? `Create Invoice for ${selectedEndCustomer.name}` 
                : 'Create Invoice'
              }
            </span>
        </button>
        </div>
      </div>

      {/* Search and Filters - Matching End Customer style */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices by number, customer, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-sm text-gray-500">
              {filteredInvoices.length} of {salesInvoices.length} invoices
            </span>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="thisYear">This Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="amount-desc">Amount (High to Low)</option>
                  <option value="amount-asc">Amount (Low to High)</option>
                  <option value="number-asc">Number (A-Z)</option>
                  <option value="number-desc">Number (Z-A)</option>
                  <option value="customer-asc">Customer (A-Z)</option>
                  <option value="customer-desc">Customer (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-xs text-gray-500 mb-1">From paid and pending invoices</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueSummary.paid + revenueSummary.pending)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueSummary.paid)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(revenueSummary.pending)}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(revenueSummary.overdue)}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Cards - Compact Grid Layout */}
      <div className="bg-white rounded-lg shadow">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No invoices available</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                            #{invoice.invoice_number}
                          </div>
                        <div className="text-xs text-gray-500">
                            {invoice.invoice_type || 'Sales Invoice'}
                          </div>
                        </div>
                      </div>
                    {getStatusBadge(invoice.status)}
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <div className="text-sm font-medium text-gray-900 truncate">
                          {invoice.recipient_name}
                      </div>
                        </div>
                        {invoice.recipient_email && (
                      <div className="text-xs text-gray-500 truncate ml-5">
                            {invoice.recipient_email}
                          </div>
                        )}
                      </div>

                  {/* Amount */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </div>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <div className="text-xs text-gray-600">
                        {formatDate(invoice.invoice_date)}
                      </div>
                    </div>
                      {invoice.due_date && (
                      <div className="text-xs text-gray-500 ml-5">
                          Due: {formatDate(invoice.due_date)}
                        </div>
                      )}
                      </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInvoice(invoice);
                      }}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    
                    {/* Status Change Buttons - Show between View and Download */}
                    {/* Customers can change from draft to pending, or from pending to paid */}
                    {invoice.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(invoice, 'pending');
                        }}
                        disabled={loading}
                        className="flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Mark Pending</span>
                      </button>
                    )}
                    
                    {invoice.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(invoice, 'paid');
                        }}
                        disabled={loading}
                        className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Mark Paid</span>
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(invoice);
                      }}
                      className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Creator Modal */}
      {showInvoiceCreator && (
        <InvoiceCreator
          isOpen={showInvoiceCreator}
          onClose={() => setShowInvoiceCreator(false)}
          onSave={handleCreateInvoice}
          businessId={businessId}
          invoiceType="customer"
          endCustomers={endCustomers}
          loading={loading}
          selectedEndCustomer={selectedEndCustomer}
        />
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetail && selectedInvoice && (
        <SalesInvoiceDetail
          isOpen={showInvoiceDetail}
          onClose={() => {
            setShowInvoiceDetail(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          colors={colors}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default SalesInvoiceList;

