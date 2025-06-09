import React, { useEffect, useState } from "react";
import api from "../../services/authService";
import { 
  FiPackage, 
  FiCalendar, 
  FiTruck, 
  FiUser, 
  FiCheckCircle, 
  FiClock, 
  FiArchive,
  FiSearch,
  FiFilter,
  FiDownload,
  FiChevronDown,
  FiChevronUp,
  FiInfo
} from "react-icons/fi";
import { FaBoxOpen, FaCheck } from "react-icons/fa";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

const OrderManagement = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [newOrderConfirmed, setNewOrderConfirmed] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/customer/orders/");
        setOrders(res.data);
        
        // Check if there's a new order confirmation in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const newOrderId = urlParams.get('newOrder');
        if (newOrderId) {
          setNewOrderConfirmed(newOrderId);
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error("Failed to fetch customer orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Format date to relative time or specific format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center";
    
    switch (status) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
            <FiClock className="mr-2" /> Pending
          </span>
        );
      case "in_production":
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700`}>
            <FiPackage className="mr-2" /> In Production
          </span>
        );
      case "shipped":
        return (
          <span className={`${baseClasses} bg-purple-50 text-purple-700`}>
            <FiTruck className="mr-2" /> Shipped
          </span>
        );
      case "completed":
        return (
          <span className={`${baseClasses} bg-green-50 text-green-700`}>
            <FiCheckCircle className="mr-2" /> Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-50 text-gray-700`}>
            <FiArchive className="mr-2" /> {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(order => {
    // Apply search filter
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.data?.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.data?.sent_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.text("Your Orders", 14, 16);
    
    // Add table
    doc.autoTable({
      head: [['Order ID', 'Product', 'Status', 'Order Date', 'Return Date']],
      body: filteredOrders.map(order => [
        order.id,
        order.data?.product || 'N/A',
        getStatusText(order.status),
        new Date(order.created_at).toLocaleDateString(),
        order.data?.return_date || 'N/A'
      ]),
      startY: 25,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      }
    });
    
    doc.save('orders.pdf');
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_production": return "In Production";
      case "shipped": return "Shipped";
      case "completed": return "Delivered";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center">
            <FaBoxOpen className="text-2xl text-indigo-600 mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Orders</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <CSVLink 
              data={filteredOrders.map(order => ({
                "Order ID": order.id,
                "Product": order.data?.product || "N/A",
                "Status": getStatusText(order.status),
                "Order Date": new Date(order.created_at).toLocaleDateString(),
                "Return Date": order.data?.return_date || "N/A",
                "Sent By": order.data?.sent_by || "N/A"
              }))} 
              filename={"orders.csv"}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="mr-2" /> Export CSV
            </CSVLink>
            
            <button 
              onClick={exportToPDF}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiDownload className="mr-2" /> Export PDF
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_production">In Production</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Delivered</option>
              </select>
            </div>
            
            <div className="text-right text-sm text-gray-500 flex items-center justify-end">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FiPackage className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "You haven't placed any orders yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className={`bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 ${
                  newOrderConfirmed === order.id.toString() ? "ring-2 ring-green-500" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Order #{order.data?.order_id || order.id}</h3>
                        {newOrderConfirmed === order.id.toString() && (
                          <span className="ml-2 flex items-center text-sm text-green-600">
                            <FaCheck className="mr-1" /> Order placed successfully
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        <FiCalendar className="inline mr-1" />
                        {formatDate(order.created_at)} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start">
                      <FiPackage className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Product</p>
                        <p className="font-medium">{order.data?.product || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FiCalendar className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Return Date</p>
                        <p className="font-medium">{order.data?.return_date || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FiUser className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Sent By</p>
                        <p className="font-medium flex items-center">
                          {order.data?.sent_by || "N/A"}
                          {order.data?.sent_by && (
                            <FiInfo className="ml-2 text-gray-400 cursor-help" title="Customer service representative" />
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleExpandOrder(order.id)}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                  >
                    {expandedOrderId === order.id ? (
                      <>
                        <FiChevronUp className="mr-1" /> Hide details
                      </>
                    ) : (
                      <>
                        <FiChevronDown className="mr-1" /> View more details
                      </>
                    )}
                  </button>
                </div>

                {expandedOrderId === order.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5">
                    <h4 className="font-medium text-gray-700 mb-3">Order Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Material</p>
                        <p className="font-medium">{order.data?.material || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">{order.data?.quantity || "1"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Customer Reference</p>
                        <p className="font-medium">{order.data?.customer || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Additional Notes</p>
                        <p className="font-medium">{order.data?.notes || "None"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;