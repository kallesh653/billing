import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import moment from 'moment';

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 * @param {String} sheetName - Name of the sheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Save file
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}_${moment().format('YYYY-MM-DD')}.xlsx`);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Export table data to PDF
 * @param {Array} columns - Column definitions [{header: 'Name', dataKey: 'name'}]
 * @param {Array} data - Array of row data
 * @param {String} filename - Name of the file (without extension)
 * @param {String} title - Document title
 * @param {Object} options - Additional options
 */
export const exportToPDF = (columns, data, filename = 'export', title = 'Report', options = {}) => {
  try {
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);

    // Add subtitle/date range if provided
    if (options.subtitle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(options.subtitle, 14, 28);
    }

    // Add company/shop name if provided
    if (options.shopName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(options.shopName, 14, 12);
    }

    // Add shop address if provided
    if (options.shopAddress) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const addressY = options.shopName ? 17 : 12;
      doc.text(options.shopAddress, 14, addressY);
    }

    // Generate table
    autoTable(doc, {
      startY: options.subtitle ? 35 : 28,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey] || '')),
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [103, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 }
    });

    // Add summary if provided
    if (options.summary && options.summary.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 35;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, finalY + 10);
      doc.setFont('helvetica', 'normal');

      let yPos = finalY + 16;
      options.summary.forEach(item => {
        doc.text(`${item.label}: ${item.value}`, 14, yPos);
        yPos += 6;
      });
    }

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const pdfFilename = `${filename}_${moment().format('YYYY-MM-DD')}.pdf`;
    doc.save(pdfFilename);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Export sales report to Excel with formatted data
 * @param {Array} bills - Bills data
 * @param {Object} settings - Business settings (optional)
 */
export const exportSalesReportToExcel = (bills, settings = {}) => {
  const shopName = settings.shopName || 'Juicy';
  const shopAddress = settings.shopAddress || '';

  // Create header rows with shop info
  const headerRows = [
    { 'Bill No': shopName },
    { 'Bill No': shopAddress },
    { 'Bill No': `Sales Report - ${moment().format('DD/MM/YYYY')}` },
    { 'Bill No': '' } // Empty row for spacing
  ];

  const data = bills.map(bill => ({
    'Bill No': bill.billNo,
    'Date': moment(bill.billDate).format('DD/MM/YYYY HH:mm'),
    'Customer': bill.customerName || 'Walk-in',
    'Mobile': bill.customerMobile || '-',
    'User': bill.userName,
    'Items': bill.items?.length || 0,
    'Subtotal': `₹${bill.subtotal?.toFixed(2)}`,
    'Discount': `₹${bill.discount?.toFixed(2) || '0.00'}`,
    'GST': `₹${bill.gstAmount?.toFixed(2) || '0.00'}`,
    'Grand Total': `₹${bill.grandTotal?.toFixed(2)}`,
    'Payment Mode': bill.paymentMode,
    'Status': bill.status
  }));

  return exportToExcel([...headerRows, ...data], 'Sales_Report', 'Sales');
};

/**
 * Export purchase report to Excel with formatted data
 * @param {Array} purchases - Purchases data
 * @param {Object} settings - Business settings (optional)
 */
export const exportPurchaseReportToExcel = (purchases, settings = {}) => {
  const shopName = settings.shopName || 'Juicy';
  const shopAddress = settings.shopAddress || '';

  // Create header rows with shop info
  const headerRows = [
    { 'Purchase No': shopName },
    { 'Purchase No': shopAddress },
    { 'Purchase No': `Purchase Report - ${moment().format('DD/MM/YYYY')}` },
    { 'Purchase No': '' } // Empty row for spacing
  ];

  const data = purchases.map(purchase => ({
    'Purchase No': purchase.purchaseNo,
    'Date': moment(purchase.invoiceDate).format('DD/MM/YYYY'),
    'Supplier': purchase.supplierName,
    'Mobile': purchase.supplierMobile || '-',
    'Invoice No': purchase.invoiceNo,
    'Items': purchase.items?.length || 0,
    'Invoice Amount': `₹${purchase.invoiceAmount?.toFixed(2)}`,
    'GST': `₹${purchase.gstAmount?.toFixed(2) || '0.00'}`,
    'Paid': `₹${purchase.paidAmount?.toFixed(2)}`,
    'Pending': `₹${purchase.pendingAmount?.toFixed(2)}`,
    'Payment Status': purchase.paymentStatus,
    'Type': purchase.isLocalPurchase ? 'Local' : 'Regular'
  }));

  return exportToExcel([...headerRows, ...data], 'Purchase_Report', 'Purchases');
};

/**
 * Export sales report to PDF
 * @param {Array} bills - Bills data
 * @param {Array} dateRange - Date range
 * @param {Object} summary - Summary data
 * @param {Object} settings - Business settings (optional)
 */
export const exportSalesReportToPDF = (bills, dateRange, summary, settings = {}) => {
  try {
    if (!bills || bills.length === 0) {
      return false;
    }

    const shopName = settings.shopName || 'Juicy';
    const shopAddress = settings.shopAddress || '';

    const columns = [
      { header: 'Bill No', dataKey: 'billNo' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Customer', dataKey: 'customer' },
      { header: 'Items', dataKey: 'items' },
      { header: 'Grand Total', dataKey: 'total' },
      { header: 'Payment', dataKey: 'payment' },
      { header: 'Status', dataKey: 'status' }
    ];

    const data = bills.map(bill => ({
      billNo: bill.billNo || '',
      date: moment(bill.billDate).format('DD/MM/YY HH:mm'),
      customer: bill.customerName || 'Walk-in',
      items: bill.items?.length || 0,
      total: `₹${(bill.grandTotal || 0).toFixed(2)}`,
      payment: bill.paymentMode || '',
      status: bill.status || ''
    }));

    const subtitle = (dateRange && dateRange[0] && dateRange[1])
      ? `Period: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}`
      : 'All Records';

    const summaryData = summary ? [
      { label: 'Total Bills', value: summary.count || 0 },
      { label: 'Total Sales', value: `₹${(summary.totalSales || 0).toFixed(2)}` },
      { label: 'Average Bill', value: `₹${((summary.totalSales / summary.count) || 0).toFixed(2)}` }
    ] : [];

    return exportToPDF(
      columns,
      data,
      'Sales_Report',
      'Sales Report',
      {
        shopName,
        shopAddress,
        subtitle,
        summary: summaryData,
        orientation: 'portrait'
      }
    );
  } catch (error) {
    return false;
  }
};

/**
 * Export purchase report to PDF
 * @param {Array} purchases - Purchases data
 * @param {Array} dateRange - Date range
 * @param {Object} summary - Summary data
 * @param {Object} settings - Business settings (optional)
 */
export const exportPurchaseReportToPDF = (purchases, dateRange, summary, settings = {}) => {
  try {
    if (!purchases || purchases.length === 0) {
      return false;
    }

    const shopName = settings.shopName || 'Juicy';
    const shopAddress = settings.shopAddress || '';

    const columns = [
      { header: 'Purchase No', dataKey: 'purchaseNo' },
      { header: 'Date', dataKey: 'date' },
      { header: 'Supplier', dataKey: 'supplier' },
      { header: 'Invoice No', dataKey: 'invoiceNo' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Paid', dataKey: 'paid' },
      { header: 'Pending', dataKey: 'pending' },
      { header: 'Status', dataKey: 'status' }
    ];

    const data = purchases.map(purchase => ({
      purchaseNo: purchase.purchaseNo || '',
      date: moment(purchase.invoiceDate).format('DD/MM/YY'),
      supplier: purchase.supplierName || '',
      invoiceNo: purchase.invoiceNo || '',
      amount: `₹${(purchase.invoiceAmount || 0).toFixed(2)}`,
      paid: `₹${(purchase.paidAmount || 0).toFixed(2)}`,
      pending: `₹${(purchase.pendingAmount || 0).toFixed(2)}`,
      status: purchase.paymentStatus || ''
    }));

    const subtitle = (dateRange && dateRange[0] && dateRange[1])
      ? `Period: ${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}`
      : 'All Records';

    const summaryData = summary ? [
      { label: 'Total Purchases', value: summary.count || 0 },
      { label: 'Total Amount', value: `₹${(summary.totalAmount || 0).toFixed(2)}` },
      { label: 'Total Pending', value: `₹${(summary.totalPending || 0).toFixed(2)}` }
    ] : [];

    return exportToPDF(
      columns,
      data,
      'Purchase_Report',
      'Purchase Report',
      {
        shopName,
        shopAddress,
        subtitle,
        summary: summaryData,
        orientation: 'landscape'
      }
    );
  } catch (error) {
    return false;
  }
};

/**
 * Print thermal bill
 * @param {Object} bill - Bill data
 * @param {Object} settings - Business settings (optional)
 */
export const printThermalBill = (bill, settings = {}) => {
  const shopName = settings.shopName || 'Juicy';
  const shopAddress = settings.shopAddress || '';
  const shopMobile = settings.shopMobile || '';
  const shopEmail = settings.shopEmail || '';
  const gstNumber = settings.gstNumber || '';
  const footerText = settings.thermalPrinterSettings?.footerText || 'Thank You! Visit Again';
  const enableLogo = settings.thermalPrinterSettings?.enableLogo || false;
  const logo = settings.logo || '';

  const printWindow = window.open('', '_blank', 'width=300,height=600');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill #${bill.billNo}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 5mm;
          width: 70mm;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 5px 0; }
        .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
        h2 { margin: 5px 0; font-size: 16px; }
        h3 { margin: 3px 0; font-size: 14px; }
        p { margin: 2px 0; }
        .logo { max-width: 60mm; max-height: 20mm; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="center">
        ${enableLogo && logo ? `<img src="${logo}" class="logo" alt="Logo" />` : ''}
        <h2>${shopName.toUpperCase()}</h2>
        ${shopAddress ? `<p>${shopAddress}</p>` : ''}
        ${shopMobile ? `<p>Contact: ${shopMobile}</p>` : ''}
        ${shopEmail ? `<p>${shopEmail}</p>` : ''}
        ${gstNumber ? `<p>GST: ${gstNumber}</p>` : ''}
      </div>
      <div class="line"></div>

      <p><span class="bold">Bill No:</span> ${bill.billNo}</p>
      <p><span class="bold">Date:</span> ${moment(bill.billDate).format('DD/MM/YYYY HH:mm')}</p>

      <div class="line"></div>

      <div class="item-row bold">
        <span>Item</span>
        <span>Qty</span>
        <span>Rate</span>
        <span>Amount</span>
      </div>
      <div class="line"></div>

      ${bill.items?.map(item => `
        <div class="item-row">
          <span>${item.itemName}</span>
          <span>${item.quantity}</span>
          <span>₹${item.price?.toFixed(2)}</span>
          <span>₹${(item.itemTotal || item.total)?.toFixed(2)}</span>
        </div>
      `).join('')}

      <div class="line"></div>

      <div class="total-row">
        <span>Subtotal:</span>
        <span>₹${bill.subtotal?.toFixed(2)}</span>
      </div>

      ${bill.discountAmount > 0 ? `
        <div class="total-row">
          <span>Discount (${bill.discountPercent}%):</span>
          <span>- ₹${bill.discountAmount?.toFixed(2)}</span>
        </div>
      ` : ''}

      ${bill.gstAmount > 0 ? `
        <div class="total-row">
          <span>GST:</span>
          <span>₹${bill.gstAmount?.toFixed(2)}</span>
        </div>
      ` : ''}

      ${bill.roundOff !== 0 ? `
        <div class="total-row">
          <span>Round Off:</span>
          <span>${bill.roundOff > 0 ? '+' : ''}₹${bill.roundOff?.toFixed(2)}</span>
        </div>
      ` : ''}

      <div class="line"></div>

      <div class="total-row" style="font-size: 14px;">
        <span>GRAND TOTAL:</span>
        <span>₹${bill.grandTotal?.toFixed(2)}</span>
      </div>

      <div class="line"></div>

      <div class="total-row">
        <span>Payment Mode:</span>
        <span>${bill.paymentMode}</span>
      </div>

      <div class="line"></div>

      <div class="center" style="margin-top: 10px;">
        <p>${footerText}</p>
        <p style="font-size: 10px;">Generated by ${shopName} Billing System</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
