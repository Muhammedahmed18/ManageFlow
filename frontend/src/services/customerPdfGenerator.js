import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateCustomerOrderPDF = async (order) => {
  try {
    console.log("Downloading PDF for order:", order);
    console.log("Order business_name:", order.business_name);
    console.log("Order business:", order.business);
    console.log("Full order object:", JSON.stringify(order, null, 2));

    // --- Enhanced Helper Functions and Constants ---
    const getStatusColor = (status) => {
      const statusColors = {
        'pending': rgb(1, 0.647, 0),         // Orange
        'in_production': rgb(0.255, 0.412, 0.882), // Royal Blue
        'shipped': rgb(0.502, 0.251, 0.831), // Blue Violet
        'completed': rgb(0.133, 0.545, 0.133), // Forest Green
        'cancelled': rgb(0.863, 0.078, 0.235), // Crimson
        'draft': rgb(0.502, 0.502, 0.502),   // Gray
      };
      return statusColors[status?.toLowerCase()] || rgb(0.5, 0.5, 0.5);
    };

    const getStatusText = (status) => {
      const statusTexts = {
        'pending': 'Pending Review',
        'in_production': 'In Production',
        'shipped': 'Shipped',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'draft': 'Draft',
      };
      return statusTexts[status?.toLowerCase()] || status || 'Status Unknown';
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        return dateString;
      }
    };

    const formatCurrency = (amount) => {
      if (!amount && amount !== 0) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const wrapText = (text, maxWidth, font, fontSize) => {
      if (!text) return [''];
      const words = String(text).split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    const capitalizeWords = (str) => {
      if (!str) return '';
      return String(str).replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    };

    // --- Enhanced Color Scheme ---
    const colors = {
      primary: rgb(0.086, 0.204, 0.396),      // Deep Navy Blue
      secondary: rgb(0.176, 0.176, 0.176),     // Professional Gray
      accent: rgb(0.027, 0.027, 0.027),        // Almost Black
      background: rgb(0.98, 0.98, 0.98),       // Light Background
      surface: rgb(1, 1, 1),                   // White Surface
      border: rgb(0.827, 0.827, 0.827),        // Light Border
      tableHeader: rgb(0.086, 0.204, 0.396),   // Navy Header
      alternateRow: rgb(0.976, 0.976, 0.976),  // Very Light Gray
      highlight: rgb(0.941, 0.961, 1),         // Light Blue Highlight
      success: rgb(0.133, 0.545, 0.133),       // Success Green
      warning: rgb(1, 0.647, 0),               // Warning Orange
      error: rgb(0.863, 0.078, 0.235),         // Error Red
    };

    // --- PDF Setup ---
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = pageHeight - margin;

    const fonts = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    };

    // --- Enhanced Header Section ---
    const drawHeader = () => {
      const headerHeight = 90;
      const headerY = yPosition;

      // Header background with gradient effect
      page.drawRectangle({
        x: margin,
        y: headerY - headerHeight,
        width: contentWidth,
        height: headerHeight,
        color: colors.surface,
        borderColor: colors.border,
        borderWidth: 2,
      });

      // Top accent line
      page.drawRectangle({
        x: margin,
        y: headerY - 8,
        width: contentWidth,
        height: 8,
        color: colors.primary,
      });

      // Business information
      const businessName = order.business_name || "ManageFlow Business";
      page.drawText(businessName, {
        x: margin + 25,
        y: headerY - 35,
        size: 20,
        font: fonts.bold,
        color: colors.primary,
      });

      page.drawText("ORDER REPORT", {
        x: margin + 25,
        y: headerY - 55,
        size: 16,
        font: fonts.bold,
        color: colors.accent,
      });

      // Report metadata
      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      page.drawText(`Generated: ${generatedDate}`, {
        x: pageWidth - margin - 180,
        y: headerY - 35,
        size: 9,
        font: fonts.regular,
        color: colors.secondary,
      });

      page.drawText(`Report ID: RPT-${Date.now().toString(36).toUpperCase()}`, {
        x: pageWidth - margin - 180,
        y: headerY - 50,
        size: 9,
        font: fonts.regular,
        color: colors.secondary,
      });

      return headerY - headerHeight - 25;
    };

    yPosition = drawHeader();

    // --- Enhanced Order Summary Section ---
    const drawOrderSummary = () => {
      // Section title with underline
      page.drawText("Order Summary", {
        x: margin,
        y: yPosition,
        size: 16,
        font: fonts.bold,
        color: colors.primary,
      });

      page.drawLine({
        start: { x: margin, y: yPosition - 5 },
        end: { x: margin + fonts.bold.widthOfTextAtSize("Order Summary", 16) + 20, y: yPosition - 5 },
        thickness: 2,
        color: colors.primary,
      });

      yPosition -= 30;

      // Enhanced summary card
      const cardHeight = 120;
      const cardY = yPosition - cardHeight;

      // Card shadow effect
      page.drawRectangle({
        x: margin + 2,
        y: cardY - 2,
        width: contentWidth,
        height: cardHeight,
        color: rgb(0.9, 0.9, 0.9),
      });

      // Main card
      page.drawRectangle({
        x: margin,
        y: cardY,
        width: contentWidth,
        height: cardHeight,
        color: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      });

      // Status badge (enhanced)
      const statusText = getStatusText(order.status);
      const statusBadgeWidth = fonts.bold.widthOfTextAtSize(statusText, 11) + 30;
      const statusBadgeHeight = 25;
      const statusBadgeX = pageWidth - margin - statusBadgeWidth - 15;
      const statusBadgeY = yPosition - 15;

      page.drawRectangle({
        x: statusBadgeX,
        y: statusBadgeY - statusBadgeHeight,
        width: statusBadgeWidth,
        height: statusBadgeHeight,
        color: getStatusColor(order.status),
      });

      page.drawText(statusText, {
        x: statusBadgeX + 15,
        y: statusBadgeY - 18,
        size: 11,
        font: fonts.bold,
        color: colors.surface,
      });

      // Key information grid (2x2 layout)
      const keyInfo = [
        { 
          label: "Order Number", 
          value: order.order_number || order.id || 'N/A',
          icon: "#"
        },
        { 
          label: "Order Date", 
          value: formatDate(order.created_at),
          icon: "DATE:"
        },
        { 
          label: "Last Updated", 
          value: formatDate(order.updated_at || order.created_at),
          icon: "UPD:"
        },
        { 
          label: "Priority", 
          value: capitalizeWords(order.priority || order.data?.priority || 'Normal'),
          icon: "PRI:"
        }
      ];

      const gridStartY = yPosition - 50;
      const gridItemWidth = (contentWidth - 40) / 2;
      const gridItemHeight = 30;

      keyInfo.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + 15 + (col * gridItemWidth);
        const y = gridStartY - (row * gridItemHeight);

        // Item background
        page.drawRectangle({
          x: x - 5,
          y: y - 20,
          width: gridItemWidth - 10,
          height: 25,
          color: colors.background,
        });

        // Icon and label
        page.drawText(`${item.icon} ${item.label}`, {
          x: x,
          y: y,
          size: 9,
          font: fonts.bold,
          color: colors.secondary,
        });

        // Value
        page.drawText(String(item.value), {
          x: x,
          y: y - 15,
          size: 11,
          font: fonts.bold,
          color: colors.accent,
        });
      });

      return cardY - 25;
    };

    yPosition = drawOrderSummary();

    // --- Enhanced Order Details Section ---
    const drawOrderDetails = () => {
      // Check for page break
      if (yPosition < margin + 200) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = drawHeader();
        yPosition -= 20;
      }

      // Section title
      page.drawText("Detailed Information", {
        x: margin,
        y: yPosition,
        size: 16,
        font: fonts.bold,
        color: colors.primary,
      });

      page.drawLine({
        start: { x: margin, y: yPosition - 5 },
        end: { x: margin + fonts.bold.widthOfTextAtSize("Detailed Information", 16) + 20, y: yPosition - 5 },
        thickness: 2,
        color: colors.primary,
      });

      yPosition -= 35;

      if (!order.data || Object.keys(order.data).length === 0) {
        // Enhanced no data message
        const noDataHeight = 60;
        page.drawRectangle({
          x: margin,
          y: yPosition - noDataHeight,
          width: contentWidth,
          height: noDataHeight,
          color: rgb(0.98, 0.96, 0.94),
          borderColor: colors.warning,
          borderWidth: 2,
        });

        page.drawText("INFO: No Additional Details Available", {
          x: margin + 20,
          y: yPosition - 25,
          size: 14,
          font: fonts.bold,
          color: colors.warning,
        });

        page.drawText("This order contains only basic information. Additional details may be added later.", {
          x: margin + 20,
          y: yPosition - 45,
          size: 10,
          font: fonts.regular,
          color: colors.secondary,
        });

        return yPosition - noDataHeight - 20;
      }

      // Enhanced field groups with better organization
      const fieldGroups = {
        'ORDER INFORMATION': {
          color: colors.primary,
          fields: [
            { key: 'order_number', label: 'Order Number', type: 'text' },
            { key: 'order_date', label: 'Order Date', type: 'date' },
            { key: 'due_date', label: 'Due Date', type: 'date' },
            { key: 'return_date', label: 'Return Date', type: 'date' },
            { key: 'priority', label: 'Priority', type: 'priority' },
          ]
        },
        'PRODUCT & SERVICES': {
          color: rgb(0.2, 0.6, 0.2),
          fields: [
            { key: 'product', label: 'Product/Service', type: 'text' },
            { key: 'material', label: 'Material', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'size', label: 'Size/Dimensions', type: 'text' },
            { key: 'color', label: 'Color', type: 'text' },
            { key: 'specifications', label: 'Specifications', type: 'long_text' },
          ]
        },
        'CUSTOMER DETAILS': {
          color: rgb(0.6, 0.2, 0.6),
          fields: [
            { key: 'customer', label: 'Customer Name', type: 'text' },
            { key: 'customer_email', label: 'Email', type: 'email' },
            { key: 'customer_phone', label: 'Phone', type: 'phone' },
            { key: 'sent_by', label: 'Contact Person', type: 'text' },
            { key: 'company', label: 'Company', type: 'text' },
          ]
        },
        'FINANCIAL INFORMATION': {
          color: rgb(0.8, 0.6, 0.1),
          fields: [
            { key: 'amount', label: 'Total Amount', type: 'currency' },
            { key: 'deposit', label: 'Deposit Paid', type: 'currency' },
            { key: 'balance', label: 'Balance Due', type: 'currency' },
            { key: 'payment_method', label: 'Payment Method', type: 'text' },
            { key: 'payment_status', label: 'Payment Status', type: 'status' },
          ]
        },
        'ADDITIONAL NOTES': {
          color: rgb(0.4, 0.4, 0.4),
          fields: [
            { key: 'special_instructions', label: 'Special Instructions', type: 'long_text' },
            { key: 'notes', label: 'Internal Notes', type: 'long_text' },
            { key: 'comments', label: 'Comments', type: 'long_text' },
          ]
        }
      };

      const formatFieldValue = (value, type) => {
        if (!value && value !== 0) return 'Not specified';
        
        switch (type) {
          case 'date':
            return formatDate(value);
          case 'currency':
            return formatCurrency(value);
          case 'priority':
            return capitalizeWords(value);
          case 'email':
            return String(value).toLowerCase();
          case 'phone':
            return String(value);
          case 'number':
            return isNaN(value) ? String(value) : Number(value).toLocaleString();
          case 'status':
            return capitalizeWords(value);
          default:
            return String(value);
        }
      };

      // Process each group
      for (const [groupName, groupConfig] of Object.entries(fieldGroups)) {
        const validFields = groupConfig.fields.filter(field => {
          const value = order.data[field.key];
          return value !== undefined && value !== null && value !== '' && String(value).trim() !== '';
        });

        if (validFields.length === 0) continue;

        // Calculate required space
        const titleHeight = 35;
        const fieldHeight = 28;
        const groupPadding = 20;
        const requiredHeight = titleHeight + (validFields.length * fieldHeight) + groupPadding;
        
        // Check if we need a new page
        if (yPosition - requiredHeight < margin + 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = drawHeader();
          yPosition -= 20;
          page.drawText("Detailed Information (continued)", {
            x: margin,
            y: yPosition,
            size: 16,
            font: fonts.bold,
            color: colors.primary,
          });
          yPosition -= 35;
        }

        // Group header
        const groupHeaderHeight = 35;
        page.drawRectangle({
          x: margin,
          y: yPosition - groupHeaderHeight,
          width: contentWidth,
          height: groupHeaderHeight,
          color: groupConfig.color,
        });

        page.drawText(groupName, {
          x: margin + 20,
          y: yPosition - 22,
          size: 14,
          font: fonts.bold,
          color: colors.surface,
        });

        yPosition -= groupHeaderHeight;

        // Fields container
        const fieldsHeight = validFields.length * fieldHeight;
        page.drawRectangle({
          x: margin,
          y: yPosition - fieldsHeight,
          width: contentWidth,
          height: fieldsHeight,
          color: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        });

        // Draw each field
        validFields.forEach((field, index) => {
          const fieldY = yPosition - ((index + 1) * fieldHeight);
          const rowColor = index % 2 === 0 ? colors.surface : colors.alternateRow;

          // Row background
          page.drawRectangle({
            x: margin,
            y: fieldY,
            width: contentWidth,
            height: fieldHeight,
            color: rowColor,
          });

          // Field label
          page.drawText(`${field.label}:`, {
            x: margin + 20,
            y: fieldY + 16,
            size: 10,
            font: fonts.bold,
            color: colors.secondary,
          });

          // Field value
          const rawValue = order.data[field.key];
          const formattedValue = formatFieldValue(rawValue, field.type);
          
          if (field.type === 'long_text') {
            // Handle long text with wrapping
            const wrappedLines = wrapText(formattedValue, contentWidth * 0.6, fonts.regular, 10);
            wrappedLines.slice(0, 2).forEach((line, lineIndex) => { // Limit to 2 lines
              page.drawText(line, {
                x: margin + contentWidth * 0.35,
                y: fieldY + 16 - (lineIndex * 12),
                size: 10,
                font: fonts.regular,
                color: colors.accent,
              });
            });
            if (wrappedLines.length > 2) {
              page.drawText('...', {
                x: margin + contentWidth * 0.35 + fonts.regular.widthOfTextAtSize(wrappedLines[1], 10),
                y: fieldY + 4,
                size: 10,
                font: fonts.italic,
                color: colors.secondary,
              });
            }
          } else {
            // Regular field value
            page.drawText(formattedValue, {
              x: margin + contentWidth * 0.35,
              y: fieldY + 16,
              size: 10,
              font: fonts.regular,
              color: colors.accent,
            });
          }
        });

        yPosition -= fieldsHeight + 20;
      }

      return yPosition;
    };

    yPosition = drawOrderDetails();

    // --- Enhanced Footer Section ---
    const drawFooter = (currentPage, pageNumber, totalPages) => {
      const footerY = margin - 10;
      
      // Footer background
      currentPage.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: footerY + 35,
        color: colors.background,
      });

      // Footer separator line
      currentPage.drawLine({
        start: { x: margin, y: footerY + 25 },
        end: { x: pageWidth - margin, y: footerY + 25 },
        thickness: 1,
        color: colors.border,
      });

      // Left: Company branding
      currentPage.drawText("Generated by ManageFlow", {
        x: margin,
        y: footerY + 10,
        size: 9,
        font: fonts.bold,
        color: colors.primary,
      });

      // Center: Order reference
      const orderRef = `Order: ${order.order_number || order.id}`;
      const centerX = pageWidth / 2 - (fonts.regular.widthOfTextAtSize(orderRef, 9) / 2);
      currentPage.drawText(orderRef, {
        x: centerX,
        y: footerY + 10,
        size: 9,
        font: fonts.regular,
        color: colors.secondary,
      });

      // Right: Page numbers
      const pageText = `Page ${pageNumber} of ${totalPages}`;
      currentPage.drawText(pageText, {
        x: pageWidth - margin - fonts.regular.widthOfTextAtSize(pageText, 9),
        y: footerY + 10,
        size: 9,
        font: fonts.regular,
        color: colors.secondary,
      });
    };

    // Add footer to all pages
    const pages = pdfDoc.getPages();
    pages.forEach((p, i) => drawFooter(p, i + 1, pages.length));

    // --- Finalize and Download ---
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Enhanced filename with better formatting
    const orderNumber = order.order_number || order.id || 'Unknown';
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `ManageFlow_Order_${orderNumber}_${dateStamp}.pdf`;
    
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

