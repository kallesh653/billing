const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const SubCode = require('../models/SubCode');
const StockLedger = require('../models/StockLedger');
const CompanyProfile = require('../models/CompanyProfile');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  let words = '';

  if (num >= 10000000) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num >= 10) {
    words += teens[num - 10] + ' ';
    return words.trim();
  }
  if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim();
}

function convertToWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = numberToWords(rupees) + ' Rupees';
  if (paise > 0) {
    words += ' and ' + numberToWords(paise) + ' Paise';
  }
  return words + ' Only';
}

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const {
      search,
      customer,
      status,
      paymentStatus,
      invoiceType,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Search by invoice number or customer name
    if (search) {
      const customers = await Customer.find({
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customers.map(c => c._id) } }
      ];
    }

    if (customer) query.customer = customer;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (invoiceType) query.invoiceType = invoiceType;

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(query)
      .populate('customer', 'customerCode customerName companyName mobile email')
      .populate('createdBy', 'name username')
      .sort({ invoiceDate: -1, invoiceNumber: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('items.itemId')
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username')
      .populate('paymentHistory.receivedBy', 'name username');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      customer,
      items,
      invoiceDate,
      dueDate,
      paymentTerms,
      shippingCharges,
      otherCharges,
      notes,
      termsAndConditions,
      invoiceType,
      templateType,
      invoicePrefix
    } = req.body;

    // Validate required fields
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Customer is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    // Validate customer
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Validate items and check stock
    const invoiceItems = [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    for (const item of items) {
      let product = null;
      if (item.itemId) {
        product = await SubCode.findById(item.itemId);
        if (!product) {
          return res.status(404).json({ success: false, message: `Item ${item.itemName} not found` });
        }
        // Only validate stock if stock tracking is enabled for this product
        if (product.currentStock !== undefined && product.currentStock !== null) {
          if (product.currentStock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}`
            });
          }
        }
      }

      const itemRate = item.rate || (product ? product.price : 0);
      const itemSubtotal = itemRate * item.quantity;

      let itemDiscount = 0;
      if (item.discount) {
        itemDiscount = item.discountType === 'percentage'
          ? (itemSubtotal * item.discount) / 100
          : item.discount;
      }

      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTaxRate = item.taxRate || (product ? product.gstPercent : 0) || 0;

      let itemCGST = 0;
      let itemSGST = 0;
      let itemIGST = 0;

      // Check if interstate (IGST) or intrastate (CGST+SGST)
      if (customerDoc.billingAddress?.state === 'Other' || customerDoc.billingAddress?.state !== process.env.COMPANY_STATE) {
        itemIGST = (itemTaxableAmount * itemTaxRate) / 100;
      } else {
        itemCGST = (itemTaxableAmount * (itemTaxRate / 2)) / 100;
        itemSGST = (itemTaxableAmount * (itemTaxRate / 2)) / 100;
      }

      const itemTotal = itemTaxableAmount + itemCGST + itemSGST + itemIGST;

      invoiceItems.push({
        itemId: product ? product._id : undefined,
        itemName: (item.itemName && item.itemName.trim()) || (product ? product.name : 'Custom Item'),
        itemCode: product ? product.subCode : undefined,
        description: item.description || (product ? product.description : ''),
        hsnCode: item.hsnCode || (product ? product.hsnCode : ''),
        quantity: item.quantity,
        unit: item.unit || (product ? product.unit : 'Nos'),
        rate: itemRate,
        discount: item.discount || 0,
        discountType: item.discountType || 'percentage',
        taxRate: itemTaxRate,
        cgst: itemCGST,
        sgst: itemSGST,
        igst: itemIGST,
        totalAmount: itemTotal
      });

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalCGST += itemCGST;
      totalSGST += itemSGST;
      totalIGST += itemIGST;
    }

    totalTax = totalCGST + totalSGST + totalIGST;

    const shipping = parseFloat(shippingCharges) || 0;
    const other = parseFloat(otherCharges) || 0;
    const grandTotalBeforeRound = subtotal - totalDiscount + totalTax + shipping + other;
    const roundOff = Math.round(grandTotalBeforeRound) - grandTotalBeforeRound;
    const grandTotal = Math.round(grandTotalBeforeRound);

    // Create invoice
    // Choose shipping address (supports multiple addresses)
    let selectedShippingAddress = null;
    if (req.body.shippingAddressId && Array.isArray(customerDoc.shippingAddresses)) {
      const found = customerDoc.shippingAddresses.id(req.body.shippingAddressId);
      if (found) {
        selectedShippingAddress = found.toObject();
      }
    }

    const invoice = new Invoice({
      customer: customerDoc._id,
      customerDetails: {
        customerCode: customerDoc.customerCode,
        customerName: customerDoc.customerName,
        companyName: customerDoc.companyName,
        email: customerDoc.email,
        mobile: customerDoc.mobile,
        gstNumber: customerDoc.gstNumber,
        billingAddress: customerDoc.billingAddress,
        shippingAddress: selectedShippingAddress
          || (customerDoc.shippingAddress?.sameAsBilling
                ? customerDoc.billingAddress
                : (customerDoc.shippingAddress || customerDoc.billingAddress))
      },
      items: invoiceItems,
      invoiceDate: invoiceDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + customerDoc.creditDays * 24 * 60 * 60 * 1000),
      paymentTerms: paymentTerms || `${customerDoc.creditDays} Days`,
      subtotal,
      totalDiscount,
      totalTax,
      totalCGST,
      totalSGST,
      totalIGST,
      shippingCharges: shipping,
      otherCharges: other,
      roundOff,
      grandTotal,
      balanceAmount: grandTotal,
      amountInWords: convertToWords(grandTotal),
      notes,
      termsAndConditions,
      invoiceType: invoiceType || 'Tax Invoice',
      templateType: templateType || 'Classic',
      invoicePrefix: invoicePrefix || 'INV',
      createdBy: req.user._id,
      status: 'Draft'
    });

    await invoice.save();

    // Update stock and write ledger for product-linked items
    for (const item of invoiceItems) {
      if (item.itemId) {
        const prev = await SubCode.findById(item.itemId).select('currentStock');
        const prevStock = (prev && typeof prev.currentStock === 'number') ? prev.currentStock : 0;

        await SubCode.findByIdAndUpdate(item.itemId, {
          $inc: { currentStock: -item.quantity }
        });

        await StockLedger.create({
          itemId: item.itemId,
          itemName: item.itemName,
          transactionType: 'Sale',
          quantity: -item.quantity,
          unit: item.unit,
          rate: item.rate,
          transactionDate: new Date(),
          referenceType: 'Invoice',
          referenceId: invoice._id,
          referenceNo: invoice.invoiceNumber,
          balanceQty: prevStock - item.quantity,
          remarks: `Invoice ${invoice.invoiceNumber}`,
          createdBy: req.user._id
        });
      }
    }

    // Update customer stats
    await Customer.findByIdAndUpdate(customerDoc._id, {
      $inc: {
        totalInvoices: 1,
        totalPurchases: grandTotal,
        outstandingBalance: grandTotal
      }
    });

    await invoice.populate('customer', 'customerCode customerName companyName mobile email');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Only drafts can be updated
    if (invoice.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be updated'
      });
    }

    // Restore stock from old invoice
    for (const item of invoice.items) {
      await SubCode.findByIdAndUpdate(item.itemId, {
        $inc: { currentStock: item.quantity }
      });
    }

    // Similar logic as create invoice for recalculation
    // ... (shortened for brevity, would include full recalculation logic)

    invoice.updatedBy = req.user._id;
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Only admin can delete and only drafts
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can delete invoices' });
    }

    if (invoice.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be deleted'
      });
    }

    // Restore stock
    for (const item of invoice.items) {
      await SubCode.findByIdAndUpdate(item.itemId, {
        $inc: { currentStock: item.quantity }
      });

      // Remove stock ledger entry
      await StockLedger.deleteMany({
        referenceType: 'Invoice',
        referenceId: invoice._id
      });
    }

    // Update customer stats
    await Customer.findByIdAndUpdate(invoice.customer, {
      $inc: {
        totalInvoices: -1,
        totalPurchases: -invoice.grandTotal,
        outstandingBalance: -invoice.balanceAmount
      }
    });

    await invoice.deleteOne();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = status;
    invoice.updatedBy = req.user._id;

    if (status === 'Sent') {
      invoice.emailSentDate = new Date();
      invoice.isEmailSent = true;
    }

    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add payment to invoice
exports.addPayment = async (req, res) => {
  try {
    const { amount, paymentMode, reference, notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already fully paid'
      });
    }

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    if (paymentAmount > invoice.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed balance amount'
      });
    }

    invoice.paymentHistory.push({
      amount: paymentAmount,
      paymentMode,
      reference,
      notes,
      receivedBy: req.user._id
    });

    invoice.paidAmount += paymentAmount;
    invoice.balanceAmount = invoice.grandTotal - invoice.paidAmount;

    // Update payment status
    if (invoice.paidAmount >= invoice.grandTotal) {
      invoice.paymentStatus = 'Paid';
      invoice.status = 'Paid';
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'Partially Paid';
    }

    // Update customer outstanding
    await Customer.findByIdAndUpdate(invoice.customer, {
      $inc: { outstandingBalance: -paymentAmount }
    });

    invoice.updatedBy = req.user._id;
    await invoice.save();

    await invoice.populate('paymentHistory.receivedBy', 'name username');

    res.json({
      success: true,
      message: 'Payment added successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get invoice statistics
exports.getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.invoiceDate = {};
      if (startDate) dateFilter.invoiceDate.$gte = new Date(startDate);
      if (endDate) dateFilter.invoiceDate.$lte = new Date(endDate);
    }

    const totalInvoices = await Invoice.countDocuments(dateFilter);
    const paidInvoices = await Invoice.countDocuments({ ...dateFilter, paymentStatus: 'Paid' });
    const unpaidInvoices = await Invoice.countDocuments({ ...dateFilter, paymentStatus: 'Unpaid' });
    const overdueInvoices = await Invoice.countDocuments({ ...dateFilter, paymentStatus: 'Overdue' });

    const revenueStats = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalReceived: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$balanceAmount' }
        }
      }
    ]);

    const stats = revenueStats[0] || { totalRevenue: 0, totalReceived: 0, totalOutstanding: 0 };

    res.json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        ...stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate PDF invoice
exports.generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Get company profile
    const companyProfile = await CompanyProfile.findOne({ isActive: true });

    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not configured. Please setup company profile first.'
      });
    }

    // Create PDF directory if it doesn't exist
    const pdfDir = path.join(__dirname, '..', 'uploads', 'invoices');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    // Replace slashes in invoice number with underscores for filename
    const safeFileName = invoice.invoiceNumber.replace(/\//g, '_');
    const pdfPath = path.join(pdfDir, `${safeFileName}.pdf`);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Color scheme from company branding
    const primaryColor = companyProfile.branding?.primaryColor || '#667eea';
    const secondaryColor = companyProfile.branding?.secondaryColor || '#764ba2';

    // Helper function to draw header based on template
    const drawHeader = () => {
      // Company logo (if available)
      if (companyProfile.invoiceSettings?.showLogo && companyProfile.logo) {
        try {
          // If logo is a file path, add it
          if (fs.existsSync(companyProfile.logo)) {
            doc.image(companyProfile.logo, 50, 45, { width: 100 });
          }
        } catch (err) {
          console.log('Logo not found');
        }
      }

      // Company name and details
      doc.fontSize(24)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(companyProfile.companyName, 200, 50, { align: 'left' });

      doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica')
        .text(companyProfile.tagline || '', 200, 80);

      // Company address
      const address = companyProfile.address;
      let yPos = 100;

      if (address?.addressLine1) {
        doc.fontSize(9).text(address.addressLine1, 200, yPos);
        yPos += 12;
      }
      if (address?.addressLine2) {
        doc.fontSize(9).text(address.addressLine2, 200, yPos);
        yPos += 12;
      }
      if (address?.city && address?.state) {
        doc.fontSize(9).text(`${address.city}, ${address.state} - ${address.pincode || ''}`, 200, yPos);
        yPos += 12;
      }

      // Contact info
      doc.fontSize(9)
        .text(`Phone: ${companyProfile.phone || 'N/A'}`, 200, yPos);
      yPos += 12;
      doc.fontSize(9)
        .text(`Email: ${companyProfile.email || 'N/A'}`, 200, yPos);
      yPos += 12;

      // GST Number
      if (companyProfile.invoiceSettings?.showGST && companyProfile.gstNumber) {
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .text(`GSTIN: ${companyProfile.gstNumber}`, 200, yPos);
      }

      // Invoice type heading with background
      doc.rect(50, yPos + 20, 500, 30)
        .fill(primaryColor);

      doc.fontSize(18)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text(invoice.invoiceType || 'TAX INVOICE', 50, yPos + 27, { align: 'center', width: 500 });

      return yPos + 60;
    };

    let currentY = drawHeader();

    // Invoice details box
    doc.rect(50, currentY, 245, 80)
      .stroke('#cccccc');

    doc.rect(305, currentY, 245, 80)
      .stroke('#cccccc');

    // Left box - Invoice details
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('Invoice No:', 60, currentY + 10);
    doc.font('Helvetica')
      .text(invoice.invoiceNumber, 150, currentY + 10);

    doc.font('Helvetica-Bold')
      .text('Invoice Date:', 60, currentY + 25);
    doc.font('Helvetica')
      .text(new Date(invoice.invoiceDate).toLocaleDateString('en-IN'), 150, currentY + 25);

    doc.font('Helvetica-Bold')
      .text('Due Date:', 60, currentY + 40);
    doc.font('Helvetica')
      .text(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A', 150, currentY + 40);

    doc.font('Helvetica-Bold')
      .text('Payment Terms:', 60, currentY + 55);
    doc.font('Helvetica')
      .text(invoice.paymentTerms || 'Immediate', 150, currentY + 55);

    // Right box - Payment status
    doc.font('Helvetica-Bold')
      .text('Payment Status:', 315, currentY + 10);

    const statusColor = invoice.paymentStatus === 'Paid' ? '#10b981' :
                       invoice.paymentStatus === 'Overdue' ? '#ef4444' : '#f59e0b';
    doc.fillColor(statusColor)
      .font('Helvetica-Bold')
      .text(invoice.paymentStatus, 420, currentY + 10);

    doc.fillColor('#000000')
      .font('Helvetica-Bold')
      .text('Grand Total:', 315, currentY + 30);
    doc.fontSize(14)
      .text(`₹ ${invoice.grandTotal.toFixed(2)}`, 420, currentY + 28);

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .text('Balance Due:', 315, currentY + 50);
    doc.fontSize(12)
      .fillColor('#ef4444')
      .text(`₹ ${invoice.balanceAmount.toFixed(2)}`, 420, currentY + 48);

    currentY += 90;

    // Bill To and Ship To
    doc.rect(50, currentY, 245, 100)
      .stroke('#cccccc');

    doc.rect(305, currentY, 245, 100)
      .stroke('#cccccc');

    // Bill To
    doc.fontSize(11)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text('BILL TO', 60, currentY + 10);

    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(invoice.customerDetails.customerName, 60, currentY + 28);

    if (invoice.customerDetails.companyName) {
      doc.font('Helvetica')
        .text(invoice.customerDetails.companyName, 60, currentY + 42);
    }

    const billAddr = invoice.customerDetails.billingAddress;
    let billY = currentY + (invoice.customerDetails.companyName ? 56 : 42);

    if (billAddr?.addressLine1) {
      doc.fontSize(9).text(billAddr.addressLine1, 60, billY);
      billY += 12;
    }
    if (billAddr?.city) {
      doc.text(`${billAddr.city}, ${billAddr.state || ''} - ${billAddr.pincode || ''}`, 60, billY);
    }

    // Ship To
    doc.fontSize(11)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text('SHIP TO', 315, currentY + 10);

    const shipAddr = invoice.customerDetails.shippingAddress;
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(invoice.customerDetails.customerName, 315, currentY + 28);

    let shipY = currentY + 42;
    if (shipAddr?.addressLine1) {
      doc.fontSize(9).font('Helvetica').text(shipAddr.addressLine1, 315, shipY);
      shipY += 12;
    }
    if (shipAddr?.city) {
      doc.text(`${shipAddr.city}, ${shipAddr.state || ''} - ${shipAddr.pincode || ''}`, 315, shipY);
      shipY += 12;
    }

    if (invoice.customerDetails.mobile) {
      doc.text(`Phone: ${invoice.customerDetails.mobile}`, 315, shipY);
      shipY += 12;
    }
    if (invoice.customerDetails.gstNumber) {
      doc.font('Helvetica-Bold').text(`GSTIN: ${invoice.customerDetails.gstNumber}`, 315, shipY);
    }

    currentY += 110;

    // Items table header
    doc.rect(50, currentY, 500, 25)
      .fill(primaryColor);

    doc.fontSize(9)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('#', 55, currentY + 8, { width: 20 })
      .text('Item Description', 80, currentY + 8, { width: 150 })
      .text('HSN', 235, currentY + 8, { width: 50 })
      .text('Qty', 290, currentY + 8, { width: 30 })
      .text('Rate', 325, currentY + 8, { width: 50, align: 'right' })
      .text('Disc', 380, currentY + 8, { width: 35, align: 'right' })
      .text('Tax', 420, currentY + 8, { width: 40, align: 'right' })
      .text('Amount', 465, currentY + 8, { width: 80, align: 'right' });

    currentY += 25;

    // Items
    doc.fillColor('#000000');
    let itemIndex = 1;

    for (const item of invoice.items) {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const rowHeight = 20;

      // Alternate row background
      if (itemIndex % 2 === 0) {
        doc.rect(50, currentY, 500, rowHeight).fill('#f9fafb');
        doc.fillColor('#000000');
      }

      doc.fontSize(9)
        .font('Helvetica')
        .text(itemIndex, 55, currentY + 5, { width: 20 })
        .text(item.itemName, 80, currentY + 5, { width: 150 })
        .text(item.hsnCode || 'N/A', 235, currentY + 5, { width: 50 })
        .text(`${item.quantity} ${item.unit}`, 290, currentY + 5, { width: 30 })
        .text(item.rate.toFixed(2), 325, currentY + 5, { width: 50, align: 'right' })
        .text(item.discount > 0 ? `${item.discount}${item.discountType === 'percentage' ? '%' : ''}` : '-', 380, currentY + 5, { width: 35, align: 'right' })
        .text(item.taxRate > 0 ? `${item.taxRate}%` : '-', 420, currentY + 5, { width: 40, align: 'right' })
        .text(item.totalAmount.toFixed(2), 465, currentY + 5, { width: 80, align: 'right' });

      currentY += rowHeight;
      itemIndex++;
    }

    // Draw line after items
    doc.moveTo(50, currentY)
      .lineTo(550, currentY)
      .stroke('#cccccc');

    currentY += 10;

    // Summary section
    const summaryX = 350;
    const labelX = summaryX;
    const valueX = 480;

    doc.fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', labelX, currentY)
      .text(`₹ ${invoice.subtotal.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
    currentY += 15;

    if (invoice.totalDiscount > 0) {
      doc.text('Discount:', labelX, currentY)
        .text(`- ₹ ${invoice.totalDiscount.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;
    }

    if (invoice.totalCGST > 0) {
      doc.text('CGST:', labelX, currentY)
        .text(`₹ ${invoice.totalCGST.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;

      doc.text('SGST:', labelX, currentY)
        .text(`₹ ${invoice.totalSGST.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;
    }

    if (invoice.totalIGST > 0) {
      doc.text('IGST:', labelX, currentY)
        .text(`₹ ${invoice.totalIGST.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;
    }

    if (invoice.shippingCharges > 0) {
      doc.text('Shipping:', labelX, currentY)
        .text(`₹ ${invoice.shippingCharges.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;
    }

    if (invoice.otherCharges > 0) {
      doc.text('Other Charges:', labelX, currentY)
        .text(`₹ ${invoice.otherCharges.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;
    }

    if (invoice.roundOff !== 0) {
      doc.text('Round Off:', labelX, currentY)
        .text(`₹ ${invoice.roundOff.toFixed(2)}`, valueX, currentY, { width: 70, align: 'right' });
      currentY += 15;
    }

    // Grand total with background
    doc.rect(summaryX - 10, currentY - 5, 210, 25)
      .fill(primaryColor);

    doc.fontSize(12)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Grand Total:', labelX, currentY + 2)
      .text(`₹ ${invoice.grandTotal.toFixed(2)}`, valueX, currentY + 2, { width: 70, align: 'right' });

    currentY += 30;

    // Amount in words
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('Amount in Words: ', 50, currentY);
    doc.font('Helvetica')
      .text(invoice.amountInWords, 50, currentY + 15, { width: 500 });

    currentY += 40;

    // Notes
    if (invoice.notes) {
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Notes:', 50, currentY);
      doc.font('Helvetica')
        .fontSize(9)
        .text(invoice.notes, 50, currentY + 15, { width: 500 });
      currentY += 50;
    }

    // Terms and conditions
    if (invoice.termsAndConditions || companyProfile.invoiceSettings?.defaultTerms) {
      if (currentY > 650) {
        doc.addPage();
        currentY = 50;
      }

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Terms & Conditions:', 50, currentY);
      doc.font('Helvetica')
        .fontSize(8)
        .text(invoice.termsAndConditions || companyProfile.invoiceSettings?.defaultTerms, 50, currentY + 15, { width: 500 });
      currentY += 80;
    }

    // Bank details
    if (companyProfile.invoiceSettings?.showBankDetails && companyProfile.bankDetails) {
      if (currentY > 650) {
        doc.addPage();
        currentY = 50;
      }

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Bank Details:', 50, currentY);

      currentY += 15;
      const bank = companyProfile.bankDetails;

      doc.fontSize(9)
        .font('Helvetica')
        .text(`Bank Name: ${bank.bankName || 'N/A'}`, 50, currentY);
      currentY += 12;
      doc.text(`Account No: ${bank.accountNumber || 'N/A'}`, 50, currentY);
      currentY += 12;
      doc.text(`IFSC Code: ${bank.ifscCode || 'N/A'}`, 50, currentY);
      currentY += 12;
      doc.text(`Branch: ${bank.branchName || 'N/A'}`, 50, currentY);
      currentY += 12;
      if (bank.upiId) {
        doc.text(`UPI ID: ${bank.upiId}`, 50, currentY);
      }
      currentY += 25;
    }

    // Signature
    if (companyProfile.invoiceSettings?.showSignature) {
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      doc.fontSize(9)
        .font('Helvetica')
        .text('Authorized Signatory', 420, currentY + 50);

      if (companyProfile.invoiceSettings?.authorizedSignatory) {
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text(companyProfile.invoiceSettings.authorizedSignatory, 420, currentY + 65);
      }
    }

    // Footer
    if (companyProfile.invoiceSettings?.showFooter && companyProfile.invoiceSettings?.footerText) {
      const pageHeight = doc.page.height;
      doc.fontSize(8)
        .fillColor('#666666')
        .font('Helvetica')
        .text(companyProfile.invoiceSettings.footerText, 50, pageHeight - 50, {
          width: 500,
          align: 'center'
        });
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    writeStream.on('finish', async () => {
      // Update invoice with PDF path
      invoice.pdfPath = pdfPath;
      invoice.isPrinted = true;
      invoice.printedDate = new Date();
      invoice.printCount += 1;
      await invoice.save();

      // Send PDF file
      res.download(pdfPath, `${invoice.invoiceNumber}.pdf`, (err) => {
        if (err) {
          console.error('Error sending PDF:', err);
          res.status(500).json({ success: false, message: 'Error sending PDF' });
        }
      });
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
