import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  Calendar,
  User,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import api from '../../services/authService';
import toast from 'react-hot-toast';
import InvoiceCreator from './modals/InvoiceCreator';

const InvoiceManagement = ({ businessId, colors, showInvoiceCreator, setShowInvoiceCreator }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'draft':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200'
        };
      case 'sent':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
      case 'paid':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      case 'overdue':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  const StatusDropdown = ({ currentStatus, invoiceId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusOptions = [
      { value: 'draft', label: 'Draft' },
      { value: 'pending', label: 'Pending' }
    ];

    const statusStyle = getStatusStyle(currentStatus);

    if (['sent', 'paid', 'overdue', 'cancelled'].includes(currentStatus)) {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </span>
      );
    }

    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} hover:opacity-90 transition-opacity`}
        >
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          <ChevronDown size={12} className="ml-1" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="fixed w-28 bg-white rounded-md shadow-lg border z-50"
              style={{ 
                borderColor: colors.border,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
                left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0
              }}
            >
              <div className="py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleStatusChange(invoiceId, option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                      currentStatus === option.value ? 'font-medium' : ''
                    }`}
                    style={{ color: colors.textPrimary }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/management/invoices/?business=${businessId}`);
      setInvoices(response.data);
    } catch (error) {
      console.error('🔄 InvoiceManagement: Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchInvoices();
    }
  }, [businessId]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setShowInvoiceCreator(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceCreator(true);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/management/invoices/${invoiceId}/`);
        toast.success('Invoice deleted successfully');
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await api.patch(`/management/invoices/${invoiceId}/change_status/`, { status: newStatus });
      toast.success('Invoice status updated');
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F1A2B' }}>Invoices</h1>
        <p className="text-sm" style={{ color: '#52677D' }}>Manage and track all invoices for your business</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: '#52677D' }} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            style={{ 
              borderColor: '#E2E8F0',
              backgroundColor: 'white'
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            style={{ 
              borderColor: '#E2E8F0',
              backgroundColor: 'white'
            }}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4" style={{ color: '#52677D' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#0F1A2B' }}>
              No invoices found
            </h3>
            <p className="text-sm mb-6" style={{ color: '#52677D' }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first invoice to get started'
              }
            </p>
            <button
              onClick={handleCreateInvoice}
              className="px-4 py-2 rounded-lg font-medium text-white shadow hover:shadow-md transition-all flex items-center gap-2 mx-auto"
              style={{ backgroundColor: '#1C2E4A' }}
            >
              <Plus size={16} />
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Invoice Number</th>
                  <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Status</th>
                  <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Created</th>
                  <th className="text-right py-3 px-4 font-medium text-sm" style={{ color: '#0F1A2B' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm" style={{ color: '#0F1A2B' }}>
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#0F1A2B' }}>
                          {invoice.customer_name || 'No customer name'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm" style={{ color: '#0F1A2B' }}>
                        {formatCurrency(invoice.amount)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: '#0F1A2B' }}>
                          {formatDate(invoice.due_date)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusDropdown
                        currentStatus={invoice.status}
                        invoiceId={invoice.id}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm" style={{ color: '#52677D' }}>
                        {formatDate(invoice.created_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {invoice.status !== 'paid' && (
                          <>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                              title="Edit Invoice"
                            >
                              <Edit size={16} style={{ color: '#52677D' }} />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="p-1.5 rounded hover:bg-red-50 transition-colors"
                              title="Delete Invoice"
                            >
                              <Trash2 size={16} style={{ color: '#EF4444' }} />
                            </button>
                          </>
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

      {/* Invoice Creator Modal */}
      {showInvoiceCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
          >
            <InvoiceCreator
              businessId={businessId}
              editInvoice={editingInvoice}
              onCreated={() => {
                setShowInvoiceCreator(false);
                setEditingInvoice(null);
                fetchInvoices();
                toast.success(editingInvoice ? 'Invoice updated successfully!' : 'Invoice created successfully!');
              }}
              onClose={() => {
                setShowInvoiceCreator(false);
                setEditingInvoice(null);
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;