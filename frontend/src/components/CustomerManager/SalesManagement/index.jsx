import React, { useState, useEffect } from 'react';
import EndCustomerList from './EndCustomerList';
import SalesInvoiceList from './SalesInvoiceList';
import RevenueDashboard from './RevenueDashboard';
import InvoiceCreator from '../../BusinessManager/modals/InvoiceCreator';
import { Users, FileText, DollarSign } from 'lucide-react';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const SalesManagement = ({ businessId, colors }) => {
  const [activeSubTab, setActiveSubTab] = useState('customers');
  const [endCustomers, setEndCustomers] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const [selectedEndCustomer, setSelectedEndCustomer] = useState(null);

  useEffect(() => {
    if (businessId) {
      fetchEndCustomers();
      fetchSalesInvoices();
      fetchRevenueSummary();
    }
  }, [businessId]);

  const fetchEndCustomers = async () => {
    try {
      const response = await api.get(`/management/end-customers/?business=${businessId}`);
      setEndCustomers(response.data);
    } catch (error) {
      console.error('Error fetching end customers:', error);
    }
  };

  const fetchSalesInvoices = async () => {
    try {
      const response = await api.get(`/management/invoices/?business=${businessId}&invoice_type=customer`);
      setSalesInvoices(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
      toast.error('Failed to refresh invoice list');
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const response = await api.get(`/management/invoices/revenue_summary/?business=${businessId}`);
      setRevenueSummary(response.data);
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    try {
      // The invoice is already created in the InvoiceCreator component
      // The invoice is already created in the InvoiceCreator component
      // We just need to refresh the list and close the modal
      
      await fetchSalesInvoices(); // Refresh the invoices list
      setShowInvoiceCreator(false);
      setSelectedEndCustomer(null);
      return invoiceData; // Return the invoice data that was already created
    } catch (error) {
      console.error('Error refreshing invoices after creation:', error);
      // Don't throw the error here since the invoice was already created successfully
      // Just show a warning that the list might not be up to date
      toast.error('Invoice created but failed to refresh the list. Please refresh the page.');
    }
  };

  const subTabs = [
    {
      id: 'customers',
      name: 'End Customers',
      icon: Users,
      description: 'Manage your end customers'
    },
    {
      id: 'invoices',
      name: 'Sales Invoices',
      icon: FileText,
      description: 'Create and manage sales invoices'
    },
    {
      id: 'revenue',
      name: 'Revenue',
      icon: DollarSign,
      description: 'Track your sales revenue and profits'
    }
  ];

  const renderContent = () => {
    switch (activeSubTab) {
      case 'customers':
        return (
          <EndCustomerList
            businessId={businessId}
            endCustomers={endCustomers}
            onRefresh={fetchEndCustomers}
            colors={colors}
          />
        );
      case 'invoices':
        return (
          <SalesInvoiceList
            businessId={businessId}
            salesInvoices={salesInvoices}
            endCustomers={endCustomers}
            onRefresh={fetchSalesInvoices}
            colors={colors}
            showInvoiceCreator={showInvoiceCreator}
            setShowInvoiceCreator={setShowInvoiceCreator}
            selectedEndCustomer={selectedEndCustomer}
            setSelectedEndCustomer={setSelectedEndCustomer}
            onCreateInvoice={handleCreateInvoice}
          />
        );
      case 'revenue':
        return (
          <RevenueDashboard
            businessId={businessId}
            revenueSummary={revenueSummary}
            onRefresh={fetchRevenueSummary}
            colors={colors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-hidden" style={{ backgroundColor: colors?.background || '#F8FAFC' }}>
      {/* Sub Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      {/* Invoice Creator Modal */}
      {showInvoiceCreator && (
        <InvoiceCreator
          businessId={businessId}
          selectedEndCustomer={selectedEndCustomer}
          onSave={handleCreateInvoice}
          onClose={() => {
            setShowInvoiceCreator(false);
            setSelectedEndCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default SalesManagement;
