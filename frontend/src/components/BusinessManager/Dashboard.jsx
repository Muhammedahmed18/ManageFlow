import React from 'react';
import { ShoppingBag, CreditCard, BarChart3, TrendingUp, Package, DollarSign, Calendar, Clock, Truck, Check } from 'lucide-react';

const Dashboard = ({ products = [], customers = [], orders = [], invoices = [], businessId, setActiveTab }) => {
  // Ensure arrays are always arrays and log for debugging
  const productsArray = Array.isArray(products) ? products : [];
  const ordersArray = Array.isArray(orders) ? orders : [];
  const customersArray = Array.isArray(customers) ? customers : [];
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  
  console.log('Dashboard: Products count:', productsArray.length, 'Orders count:', ordersArray.length, 'Customers count:', customersArray.length, 'Invoices count:', invoicesArray.length);
  console.log('Dashboard: Invoices data:', invoicesArray);
  console.log('Dashboard: All invoices with full details:', invoicesArray.map(inv => ({
    id: inv.id,
    status: inv.status,
    invoice_type: inv.invoice_type,
    total_amount: inv.total_amount,
    amount: inv.amount,
    value: inv.value,
    subtotal: inv.subtotal,
    balance_due: inv.balance_due,
    all_fields: Object.keys(inv),
    all_values: Object.entries(inv).filter(([key, value]) => typeof value === 'number' || typeof value === 'string')
  })));
  console.log('Dashboard: Paid invoices:', invoicesArray.filter(inv => inv.status === 'paid'));
  
  // Calculate total revenue from PAID manufacturer invoices only (money manufacturer earned)
  const totalRevenue = invoicesArray
    .filter(invoice => {
      // Only include manufacturer invoices with status 'paid' (case-insensitive)
      const status = invoice.status?.toLowerCase();
      const isPaid = status === 'paid';
      const isManufacturerInvoice = invoice.invoice_type === 'manufacturer';
      console.log(`Invoice ${invoice.id} status check:`, { 
        original: invoice.status, 
        normalized: status, 
        isPaid, 
        invoice_type: invoice.invoice_type,
        isManufacturerInvoice 
      });
      return isPaid && isManufacturerInvoice;
    })
    .reduce((sum, invoice) => {
      // Use only total_amount field for consistency
      const totalAmount = parseFloat(invoice.total_amount) || 0;
      
      console.log(`Invoice ${invoice.id} amount calculation:`, {
        total_amount: totalAmount,
        finalAmount: totalAmount
      });
      
      return sum + totalAmount;
    }, 0);
  
  console.log('Revenue calculation summary:', {
    totalRevenue,
    paidManufacturerInvoicesCount: invoicesArray.filter(inv => inv.status === 'paid' && inv.invoice_type === 'manufacturer').length,
    allInvoicesCount: invoicesArray.length
  });
  
  // Debug logging for revenue calculation
  console.log('BusinessManager Dashboard Revenue Debug:', {
    totalRevenue,
    ordersCount: ordersArray.length,
    invoicesCount: invoicesArray.length,
    paidManufacturerInvoicesCount: invoicesArray.filter(inv => inv.status === 'paid' && inv.invoice_type === 'manufacturer').length,
    paidInvoices: invoicesArray.filter(inv => inv.status === 'paid' && inv.invoice_type === 'manufacturer').map(inv => ({ 
      id: inv.id, 
      amount: inv.total_amount, 
      status: inv.status,
      invoice_type: inv.invoice_type 
    }))
  });
  
  // Get recent orders (last 5)
  const recentOrders = ordersArray
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  
  // Get next delivery (earliest pending order)
  const nextDelivery = ordersArray
    .filter(order => order.status === 'pending' || order.status === 'in_production')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
  
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
            <Clock size={12} className="inline mr-1" />
            Pending
          </span>
        );
      case 'in_production':
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700`}>
            <Package size={12} className="inline mr-1" />
            In Production
          </span>
        );
      case 'shipped':
        return (
          <span className={`${baseClasses} bg-purple-50 text-purple-700`}>
            <Truck size={12} className="inline mr-1" />
            Shipped
          </span>
        );
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-50 text-green-700`}>
            <Check size={12} className="inline mr-1" />
            Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-50 text-gray-700`}>
            {status}
          </span>
        );
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
  
  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600 tracking-wide">Products</span>
          </div>
          <h2 className="text-sm font-medium text-slate-500 tracking-wide">Total Products</h2>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-bold text-slate-800 font-inter">{productsArray.length}</p>
            <span className="ml-2 text-xs text-slate-500">items</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <ShoppingBag className="text-emerald-600" size={20} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 tracking-wide">Orders</span>
          </div>
          <h2 className="text-sm font-medium text-slate-500 tracking-wide">Total Orders</h2>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-bold text-slate-800 font-inter">{ordersArray.length}</p>
            <span className="ml-2 text-xs text-slate-500">orders</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-600 tracking-wide">Revenue</span>
          </div>
          <h2 className="text-sm font-medium text-slate-500 tracking-wide">Total Revenue</h2>
          <p className="text-xs text-slate-400 mt-1">From paid invoices only</p>
          <div className="flex items-baseline mt-2">
            <p className="text-2xl font-bold text-slate-800 font-inter">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800 tracking-tight">Recent Orders</h2>
            <button 
              onClick={() => setActiveTab('orders')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium tracking-wide"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Order #{order.order_number || order.id}</p>
                      <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                                     <div className="flex items-center space-x-3">
                     <div className="text-right">
                       <p className="text-sm font-medium text-slate-800">
                         {order.total_amount && order.total_amount > 0 ? formatCurrency(order.total_amount) : ''}
                       </p>
                     </div>
                     {getStatusBadge(order.status)}
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                <ShoppingBag className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-sm text-slate-500 font-medium">No orders yet</p>
                <p className="text-xs text-slate-400 mt-1 font-light">Order data will appear here</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 tracking-wide">Next delivery</p>
                <div className="flex items-center mt-1">
                  <Calendar size={14} className="text-slate-500 mr-1" />
                  <p className="text-sm font-medium">
                    {nextDelivery ? formatDate(nextDelivery.created_at) : 'No pending deliveries'}
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 tracking-wide">Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;