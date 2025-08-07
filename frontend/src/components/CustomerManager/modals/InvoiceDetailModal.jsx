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

  const handleDownloadPDF = async (invoice, businessId) => {
    try {
      setLoading(true);
      console.log("Downloading PDF for invoice:", invoice);
  
      // Fetch business information for the PDF
      let businessInfo = null;
      try {
        const businessResponse = await api.get(`/management/customer/business/${businessId}/`);
        businessInfo = businessResponse.data;
      } catch (error) {
        console.warn("Could not fetch business information:", error);
        // Fallback business info if API call fails
        businessInfo = {
            name: "Fauget Technology",
            address: "123 Anywhere St\nAny City\n12345"
        };
      }
  
      // Create a professional PDF with enhanced layout
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
      // Define colors from the image
      const blueColor = rgb(0.12, 0.35, 0.73);
      const darkGray = rgb(0.3, 0.3, 0.3);
      const lightGray = rgb(0.9, 0.9, 0.9);
      const black = rgb(0, 0, 0);
  
      // Page dimensions
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
  
      let yPosition = pageHeight - margin;
  
      // --- Header Section ---
      const headerHeight = 70;
      const headerY = yPosition;
  
      // Invoice Title
      page.drawText("Invoice", {
        x: margin,
        y: headerY - 20,
        size: 30,
        font: helveticaBoldFont,
        color: blueColor,
      });
      
      // Business Logo (mocking with a text 'MF' as in the image)
      const logoText = "MF";
      const logoX = pageWidth - margin - 50;
      page.drawText(logoText, {
        x: logoX,
        y: headerY - 20,
        size: 40,
        font: helveticaBoldFont,
        color: blueColor
      });
  
      // Business Info
      const businessName = businessInfo?.name || "Fauget Technology";
      page.drawText(businessName, {
        x: pageWidth - margin - 150,
        y: headerY - 20,
        size: 12,
        font: helveticaBoldFont,
        color: darkGray,
        align: 'right',
      });
      const businessAddress = businessInfo?.address || "123 Anywhere St\nAny City\n12345";
      page.drawText(businessAddress, {
        x: pageWidth - margin - 150,
        y: headerY - 35,
        size: 10,
        font: helveticaFont,
        color: darkGray,
        align: 'right',
        lineHeight: 12
      });
      
      yPosition -= headerHeight;
  
      // Horizontal Separator Line
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 0.5,
        color: lightGray,
      });
  
      yPosition -= 20;
  
      // --- Client and Invoice Info Section ---
      const infoBoxY = yPosition;
      const infoBoxHeight = 80;
  
      // Client Info
      page.drawText("CLIENT", {
        x: margin,
        y: infoBoxY,
        size: 12,
        font: helveticaBoldFont,
        color: darkGray,
      });
      page.drawText(invoice.customer_name || 'N/A', {
        x: margin,
        y: infoBoxY - 20,
        size: 12,
        font: helveticaBoldFont,
        color: black,
      });
      page.drawText(`Date Issued: ${invoice.created_at ? format(new Date(invoice.created_at), 'dd MMM yy') : 'N/A'}`, {
        x: margin,
        y: infoBoxY - 40,
        size: 10,
        font: helveticaFont,
        color: darkGray,
      });
      page.drawText(`Invoice No: ${invoice.invoice_number || 'N/A'}`, {
        x: margin,
        y: infoBoxY - 55,
        size: 10,
        font: helveticaFont,
        color: darkGray,
      });
  
      yPosition -= infoBoxHeight;
  
      // --- Line Items Table Section ---
      yPosition -= 40;
  
      // Table Header
      const tableHeaderY = yPosition;
      const headerTextY = tableHeaderY - 15;
      const column1X = margin + 10;
      const column2X = margin + contentWidth * 0.45;
      const column3X = margin + contentWidth * 0.65;
      const column4X = margin + contentWidth * 0.85;
  
      page.drawText("Description", {
        x: column1X,
        y: headerTextY,
        size: 10,
        font: helveticaBoldFont,
        color: blueColor,
      });
      page.drawText("Rate", {
        x: column2X,
        y: headerTextY,
        size: 10,
        font: helveticaBoldFont,
        color: blueColor,
      });
      page.drawText("Hours", {
        x: column3X,
        y: headerTextY,
        size: 10,
        font: helveticaBoldFont,
        color: blueColor,
      });
      page.drawText("Subtotal", {
        x: column4X,
        y: headerTextY,
        size: 10,
        font: helveticaBoldFont,
        color: blueColor,
      });
  
      // Horizontal Separator Line below header
      page.drawLine({
        start: { x: margin, y: tableHeaderY - 25 },
        end: { x: pageWidth - margin, y: tableHeaderY - 25 },
        thickness: 0.5,
        color: lightGray,
      });
  
      yPosition -= 35;
      
      // Table Rows
      const items = invoice.items || [];
      const rowHeight = 25;
      let itemsSubtotal = 0;
  
      items.forEach((item) => {
          page.drawText(item.description || 'N/A', {
              x: column1X,
              y: yPosition,
              size: 10,
              font: helveticaFont,
              color: darkGray,
          });
          page.drawText(item.rate ? formatCurrency(item.rate) : '$ 0.00', {
              x: column2X,
              y: yPosition,
              size: 10,
              font: helveticaFont,
              color: darkGray,
          });
          page.drawText(`${item.hours || 0}`, {
              x: column3X,
              y: yPosition,
              size: 10,
              font: helveticaFont,
              color: darkGray,
          });
          const subtotal = (item.rate || 0) * (item.hours || 0);
          page.drawText(formatCurrency(subtotal), {
              x: column4X,
              y: yPosition,
              size: 10,
              font: helveticaFont,
              color: darkGray,
          });
  
          itemsSubtotal += subtotal;
          yPosition -= rowHeight;
      });
  
      yPosition -= 40;
  
      // --- Totals Summary Section ---
      const summaryX = margin + contentWidth * 0.6;
      const summaryValueX = margin + contentWidth * 0.85;
  
      // Total Amount
      page.drawText("Total Amount", {
        x: summaryX,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: black,
      });
      page.drawText(formatCurrency(itemsSubtotal), {
        x: summaryValueX,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: black,
      });
  
      yPosition -= 20;
  
      // Tax
      const taxRate = invoice.tax || 0.15;
      const taxAmount = itemsSubtotal * taxRate;
      page.drawText(`Tax ${taxRate * 100}%`, {
        x: summaryX,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: black,
      });
      page.drawText(formatCurrency(taxAmount), {
        x: summaryValueX,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: blueColor,
      });
  
      yPosition -= 20;
  
      // Horizontal Separator Line before Amount Due
      page.drawLine({
        start: { x: summaryX, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 0.5,
        color: lightGray,
      });
  
      yPosition -= 20;
  
      // Amount Due
      const amountDue = itemsSubtotal + taxAmount;
      page.drawText("Amount Due", {
        x: summaryX,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: black,
      });
      page.drawText(formatCurrency(amountDue), {
        x: summaryValueX,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: blueColor,
      });
  
      // --- Due By Section ---
      const dueByY = margin + 80;
      page.drawText("Due By", {
        x: pageWidth - margin - 100,
        y: dueByY + 20,
        size: 20,
        font: helveticaBoldFont,
        color: blueColor,
      });
      page.drawText(invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yy') : 'N/A', {
        x: pageWidth - margin - 100,
        y: dueByY,
        size: 16,
        font: helveticaObliqueFont,
        color: darkGray,
      });
      
      // Footer line at the bottom
      page.drawLine({
        start: { x: margin, y: margin + 10 },
        end: { x: pageWidth - margin, y: margin + 10 },
        thickness: 0.5,
        color: lightGray,
      });
  
      // Finalize and trigger download
      const pdfBytes = await pdfDoc.save();
      console.log("PDF generated, size:", pdfBytes.byteLength);
  
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${invoice.invoice_number || invoice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
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