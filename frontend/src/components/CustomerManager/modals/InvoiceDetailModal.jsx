import React, { useState } from 'react';
import { X, Download, Eye, FileText, Calendar, DollarSign, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import api from '../../../services/authService';
import toast from 'react-hot-toast';

const InvoiceDetailModal = ({ invoice, onClose, onDownload, businessId }) => {
  const [loading, setLoading] = useState(false);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      
      // Validate required data
      if (!invoice) {
        toast.error('No invoice data available for PDF generation');
        return;
      }
  
      if (!businessId) {
        toast.error('Business information is required for PDF generation');
        return;
      }
  
      console.log("Downloading PDF for invoice:", invoice);
  
      // Fetch business information for the PDF
      let businessInfo = null;
      try {
        const businessResponse = await api.get(`/management/customer/business/${businessId}/`);
        businessInfo = businessResponse.data;
      } catch (error) {
        console.warn("Could not fetch business information, using defaults:", error);
        businessInfo = {
          name: "Your Business Name",
          email: "contact@yourbusiness.com",
          phone: "(123) 456-7890"
        };
      }
  
      // Create a new PDF document
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
      const greenColor = rgb(0.2, 0.8, 0.2); // Green
      const redColor = rgb(0.8, 0.2, 0.2); // Red
      
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
      
      // Business name (use fetched data or default)
      const businessName = businessInfo?.name || "Your Business Name";
      page.drawText(businessName, {
        x: margin + 20,
        y: yPosition - 30,
        size: 18,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      
      // Invoice title
      page.drawText("INVOICE", {
        x: margin + 20,
        y: yPosition - 55,
        size: 14,
        font: helveticaBoldFont,
        color: accentColor,
      });
      
      // Add business contact info if available
      if (businessInfo?.email || businessInfo?.phone) {
        const contactInfo = [];
        if (businessInfo.email) contactInfo.push(`Email: ${businessInfo.email}`);
        if (businessInfo.phone) contactInfo.push(`Phone: ${businessInfo.phone}`);
        
        if (contactInfo.length > 0) {
          page.drawText(contactInfo.join(' | '), {
            x: margin + 20,
            y: yPosition - 75,
            size: 8,
            font: helveticaFont,
            color: secondaryColor,
          });
        }
      }
      
      yPosition -= headerHeight + 30;
      
      // Invoice summary section
      const summaryTitle = "Invoice Summary";
      page.drawText(summaryTitle, {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBoldFont,
        color: primaryColor,
      });
      yPosition -= 25;
      
      // Draw summary box
      const summaryBoxHeight = 100;
      
      page.drawRectangle({
        x: margin,
        y: yPosition - summaryBoxHeight,
        width: contentWidth,
        height: summaryBoxHeight,
        borderColor: primaryColor,
        borderWidth: 1,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      // Invoice information in two columns
      const leftColumn = margin + 20;
      const rightColumn = margin + contentWidth / 2 + 20;
      
      const invoiceInfo = [
        { 
          label: "Invoice Number", 
          value: invoice.invoice_number || `INV-${invoice.id || '0000'}` 
        },
        { 
          label: "Invoice Date", 
          value: invoice.created_at ? formatDate(invoice.created_at) : 'N/A' 
        },
        { 
          label: "Due Date", 
          value: invoice.due_date ? formatDate(invoice.due_date) : 'N/A' 
        },
        { 
          label: "Status", 
          value: invoice.status ? 
                invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 
                'Pending',
          isStatus: true 
        },
        { 
          label: "Amount", 
          value: formatCurrency(invoice.amount || 0), 
          isAmount: true 
        },
        { 
          label: "Customer", 
          value: invoice.customer_name || invoice.business_name || 'N/A' 
        },
      ];
      
      let leftY = yPosition - 20;
      let rightY = yPosition - 20;
      
      invoiceInfo.forEach(({ label, value, isStatus, isAmount }, index) => {
        const isLeftColumn = index < 3;
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
        
        // Value with special formatting
        let valueColor = accentColor;
        if (isStatus) {
          valueColor = invoice.status === 'paid' ? greenColor : 
                      invoice.status === 'overdue' ? redColor : 
                      rgb(0.8, 0.6, 0.2); // Orange for pending
        }
        if (isAmount) {
          valueColor = greenColor;
        }
        
        page.drawText(value, {
          x: x + 80,
          y: y,
          size: 10,
          font: helveticaFont,
          color: valueColor,
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
      
      // Invoice details section
      const hasItems = invoice.items && invoice.items.length > 0;
      const hasDescription = invoice.description;
      
      if (hasItems || hasDescription) {
        page.drawText("Invoice Details", {
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
        
        page.drawText("Description", {
          x: margin + 15,
          y: yPosition - 15,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });
        
        page.drawText("Amount", {
          x: margin + contentWidth - 100,
          y: yPosition - 15,
          size: 11,
          font: helveticaBoldFont,
          color: rgb(1, 1, 1),
        });
        
        yPosition -= tableHeaderHeight;
        
        // Add invoice items or description
        const items = hasItems ? 
          invoice.items : 
          [{ description: invoice.description || 'Invoice for services', amount: invoice.amount || 0 }];
        
        items.forEach((item, index) => {
          const rowHeight = 20;
          
          // Alternate row colors
          const rowColor = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98);
          
          page.drawRectangle({
            x: margin,
            y: yPosition - rowHeight,
            width: contentWidth,
            height: rowHeight,
            color: rowColor,
          });
          
          // Description
          const description = item.description || 'Invoice item';
          page.drawText(description, {
            x: margin + 15,
            y: yPosition - 8,
            size: 10,
            font: helveticaFont,
            color: secondaryColor,
          });
          
          // Amount
          const amount = formatCurrency(item.amount || item.price || 0);
          page.drawText(amount, {
            x: margin + contentWidth - 100,
            y: yPosition - 8,
            size: 10,
            font: helveticaFont,
            color: greenColor,
          });
          
          yPosition -= rowHeight;
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
      link.setAttribute(
        "download", 
        `invoice_${invoice.invoice_number || invoice.id || 'unknown'}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
  
      toast.success("Invoice PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download invoice PDF:", error);
      toast.error(`Failed to download invoice PDF: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Invoice Details</h3>
              <p className="text-sm text-gray-500">
                {invoice.invoice_number || `INV-${invoice.id}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Invoice Information */}
            <div className="space-y-6">
              {/* Invoice Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium">{invoice.invoice_number || `INV-${invoice.id}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-medium">{formatDate(invoice.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{formatDate(invoice.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(invoice.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Name:</span>
                    <span className="font-medium">{invoice.customer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business:</span>
                    <span className="font-medium">{invoice.business_name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Invoice Details */}
            <div className="space-y-6">
              {/* Invoice Items */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Invoice Items
                </h4>
                <div className="space-y-3">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium">{item.description || 'Invoice item'}</p>
                          {item.quantity && (
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          )}
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.amount || item.price || 0)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.description || 'Invoice for services'}</p>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal; 