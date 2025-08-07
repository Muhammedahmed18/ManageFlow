import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  ChevronDown, ChevronUp, 
  Calendar, Package, Check, Clock, Truck,
  User, FileText, Hash, AlertCircle,
  MoreVertical, Edit2, Trash2, X, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/authService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const OrderManagement = ({ 
  orders, 
  colors,
  onOrderUpdate,
  setOrders
}) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center";
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-700`}>
            <Clock size={16} className="mr-2" />
            Pending
          </span>
        );
      case 'in_production':
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700`}>
            <Package size={16} className="mr-2" />
            In Production
          </span>
        );
      case 'shipped':
        return (
          <span className={`${baseClasses} bg-purple-50 text-purple-700`}>
            <Truck size={16} className="mr-2" />
            Shipped (Pending Confirmation)
          </span>
        );
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-50 text-green-700`}>
            <Check size={16} className="mr-2" />
            Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-50 text-gray-700`}>
            <AlertCircle size={16} className="mr-2" />
            {status}
          </span>
        );
    }
  };

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

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await api.patch(`/management/manufacturer/orders/${orderId}/`, {
        status: newStatus
      });

      // Update the order in local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success('Order status updated successfully!', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
        icon: '✅',
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.error('Order not found. It may have been deleted or is not accessible.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
          icon: '❌',
        });
      } else {
        toast.error('Failed to update order status', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
          },
          icon: '❌',
        });
      }
      console.error('Failed to update order status:', err);
    } finally {
      setLoading(false);
      setOpenDropdownId(null);
    }
  };

  const StatusDropdown = ({ order, isOpen, onOpen, onChange }) => {
    const buttonRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);

    // If order is shipped, delivered, or completed, show static badge instead of dropdown
    if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
      const getStatusColor = (status) => {
        switch (status) {
          case 'shipped':
            return 'bg-purple-50 border-purple-200 text-purple-600';
          case 'delivered':
            return 'bg-blue-50 border-blue-200 text-blue-600';
          case 'completed':
            return 'bg-green-50 border-green-200 text-green-600';
          default:
            return 'bg-gray-50 border-gray-200 text-gray-600';
        }
      };
      
      return (
        <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${getStatusColor(order.status)}`}>
          {getStatusBadge(order.status)}
          <span className="text-xs font-medium">(Unchangeable)</span>
        </div>
      );
    }

    // Calculate position when opened
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;
      const handleClick = (e) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(e.target)
        ) {
          onOpen(); // toggles closed
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onOpen]);

    // Dropdown menu - only show valid status options
    const dropdownMenu = isOpen ? ReactDOM.createPortal(
      <div
        ref={dropdownRef}
        className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg animate-dropdown-fade"
        style={{
          position: 'absolute',
          top: dropdownPos.top,
          left: dropdownPos.left,
          minWidth: dropdownPos.width,
          width: 192 // 12rem
        }}
      >
        <button onClick={() => onChange('pending')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Clock className="text-yellow-500" size={16} /> Pending
        </button>
        <button onClick={() => onChange('in_production')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Package className="text-blue-500" size={16} /> In Production
        </button>
        <button onClick={() => onChange('shipped')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
          <Truck className="text-purple-500" size={16} /> Shipped
        </button>
        {/* Removed Delivered option from manufacturer dropdown */}
      </div>,
      document.body
    ) : null;

    return (
      <>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all focus:outline-none ${isOpen ? 'ring-2 ring-blue-400' : ''}`}
        >
          {getStatusBadge(order.status)}
          <ChevronDown className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        {dropdownMenu}
      </>
    );
  };

  const OrderDetailsModal = ({ order, onClose }) => (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadPDF(order)}
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
                    {getStatusBadge(order.status)}
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.data?.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.data?.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Add dropdown animation keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dropdown-fade {
        from { opacity: 0; transform: translateY(-8px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-dropdown-fade { animation: dropdown-fade 0.18s cubic-bezier(0.4,0,0.2,1); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Dropdown open state
  const handleDropdownOpen = (orderId) => setOpenDropdownId(openDropdownId === orderId ? null : orderId);
  const handleDropdownChange = (orderId, status) => {
    handleStatusChange(orderId, status);
    setOpenDropdownId(null);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleDownloadPDF = async (order) => {
    try {
      console.log("Downloading PDF for order:", order);
      console.log("Order data:", order.data);

      // Create a professional PDF with enhanced layout
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Define colors
      const primaryColor = rgb(0.2, 0.4, 0.8); // Blue
      const secondaryColor = rgb(0.3, 0.3, 0.3); // Dark gray
      const accentColor = rgb(0.1, 0.1, 0.1); // Black
      const lightGray = rgb(0.9, 0.9, 0.9); // Light gray
      
      // Page dimensions
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = pageHeight - margin;
      
      // Header with business information
      const headerHeight = 80;
      
      // Draw header background
      page.drawRectangle({
        x: margin,
        y: yPosition - headerHeight,
        width: contentWidth,
        height: headerHeight,
        color: lightGray,
      });
      
      // Business name
      page.drawText("ManageFlow Business", {
        x: margin + 20,
        y: yPosition - 30,
        size: 18,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      
      // Order title
      page.drawText("ORDER DETAILS", {
        x: margin + 20,
        y: yPosition - 55,
        size: 14,
        font: helveticaBoldFont,
        color: accentColor,
      });
      
      yPosition -= headerHeight + 30;
      
      // Order summary section
      const summaryTitle = "Order Summary";
      page.drawText(summaryTitle, {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      yPosition -= 25;
      
      // Draw summary box
      const summaryBoxHeight = 80;
      
      page.drawRectangle({
        x: margin,
        y: yPosition - summaryBoxHeight,
        width: contentWidth,
        height: summaryBoxHeight,
        borderColor: primaryColor,
        borderWidth: 1,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      // Order information in two columns
      const leftColumn = margin + 20;
      const rightColumn = margin + contentWidth / 2 + 20;
      
      const orderInfo = [
        { label: "Order Number", value: order.order_number || order.id },
        { label: "Order Date", value: formatDate(order.created_at) },
        { label: "Status", value: order.status.charAt(0).toUpperCase() + order.status.slice(1) },
        { label: "Product", value: order.data?.product || 'N/A' },
      ];
      
      let leftY = yPosition - 20;
      let rightY = yPosition - 20;
      
      orderInfo.forEach(({ label, value }, index) => {
        const isLeftColumn = index < 2;
        const x = isLeftColumn ? leftColumn : rightColumn;
        let y = isLeftColumn ? leftY : rightY;
        
        // Label
        page.drawText(`${label}:`, {
          x: x,
          y: y,
          size: 10,
          font: helveticaBoldFont,
          color: secondaryColor,
        });
        
        // Value
        page.drawText(value, {
          x: x + 80,
          y: y,
          size: 10,
          font: helveticaFont,
          color: accentColor,
        });
        
        if (isLeftColumn) {
          leftY -= 20;
        } else {
          rightY -= 20;
        }
      });
      
      yPosition -= summaryBoxHeight + 40;
      
      // Draw separator line
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1,
        color: lightGray,
      });
      
      yPosition -= 30;
      
      // Order details section
      if (order.data && Object.keys(order.data).length > 0) {
        page.drawText("Order Details", {
          x: margin,
          y: yPosition,
          size: 16,
          font: helveticaBoldFont,
          color: primaryColor,
        });
        yPosition -= 25;
        
        // Draw details table header
        const tableHeaderHeight = 25;
        page.drawRectangle({
          x: margin,
          y: yPosition - tableHeaderHeight,
          width: contentWidth,
          height: tableHeaderHeight,
          color: primaryColor,
        });
        
        page.drawText("Field", {
          x: margin + 15,
          y: yPosition - 15,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });
        
        page.drawText("Value", {
          x: margin + contentWidth / 2 + 15,
          y: yPosition - 15,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });
        
        yPosition -= tableHeaderHeight;
        
        // Add order data rows
        let rowIndex = 0;
        Object.entries(order.data).forEach(([key, value]) => {
          if (value && value !== 'N/A' && value !== '') {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const rowHeight = 20;
            
            // Alternate row colors
            const rowColor = rowIndex % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98);
            
            page.drawRectangle({
              x: margin,
              y: yPosition - rowHeight,
              width: contentWidth,
              height: rowHeight,
              color: rowColor,
            });
            
            // Field name
            page.drawText(label, {
              x: margin + 15,
              y: yPosition - 8,
              size: 10,
              font: helveticaBoldFont,
              color: secondaryColor,
            });
            
            // Field value
            const valueText = String(value);
            const maxWidth = contentWidth / 2 - 30;
            
            // Truncate long values
            let displayValue = valueText;
            if (valueText.length > 40) {
              displayValue = valueText.substring(0, 37) + '...';
            }
            
            page.drawText(displayValue, {
              x: margin + contentWidth / 2 + 15,
              y: yPosition - 8,
              size: 10,
              font: helveticaFont,
              color: accentColor,
            });
            
            yPosition -= rowHeight;
            rowIndex++;
          }
        });
        
        yPosition -= 20;
      }
      
      // Footer
      const footerY = margin + 50;
      
      // Draw footer separator line
      page.drawLine({
        start: { x: margin, y: footerY + 20 },
        end: { x: pageWidth - margin, y: footerY + 20 },
        thickness: 0.5,
        color: lightGray,
      });
      
      page.drawText("Generated by ManageFlow", {
        x: margin,
        y: footerY,
        size: 8,
        font: helveticaFont,
        color: secondaryColor,
      });
      
      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: pageWidth - margin - 120,
        y: footerY,
        size: 8,
        font: helveticaFont,
        color: secondaryColor,
      });
      
      // Add page number
      page.drawText("Page 1 of 1", {
        x: pageWidth / 2 - 30,
        y: footerY,
        size: 8,
        font: helveticaFont,
        color: secondaryColor,
      });
      
      // Finalize and trigger download
      const pdfBytes = await pdfDoc.save();
      console.log("PDF generated, size:", pdfBytes.byteLength);
      
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `order_${order.order_number || order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      toast.success("Order PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download order PDF:", error);
      toast.error(`Failed to download order PDF: ${error.message}`);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Order Management</h1>
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Product</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-100 transition">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleOrderClick(order)}
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                    >
                      {order.order_number || order.data?.order_id || order.id}
                    </button>
                  </td>
                  <td className="px-6 py-4">{order.data?.product || 'N/A'}</td>
                  <td className="px-6 py-4">{order.data?.customer || 'N/A'}</td>
                  <td className="px-6 py-4">{formatDate(order.created_at)}</td>
                  <td className="px-6 py-4">
                    <StatusDropdown
                      order={order}
                      isOpen={openDropdownId === order.id}
                      onOpen={() => handleDropdownOpen(order.id)}
                      onChange={status => handleDropdownChange(order.id, status)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(order)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderManagement;