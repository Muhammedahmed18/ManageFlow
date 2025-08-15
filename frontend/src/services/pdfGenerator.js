import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatDate } from '../utils/orderUtils.jsx';

export const generateOrderPDF = async (order) => {
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
  
  // Finalize and return bytes
  return await pdfDoc.save();
};

export const downloadPDF = async (order) => {
  try {
    console.log("Downloading PDF for order:", order);
    console.log("Order data:", order.data);

    const pdfBytes = await generateOrderPDF(order);
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

    return true;
  } catch (error) {
    console.error("Failed to download order PDF:", error);
    throw new Error(`Failed to download order PDF: ${error.message}`);
  }
};

