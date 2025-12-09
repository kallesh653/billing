const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const SubCode = require('../models/SubCode');
const StockLedger = require('../models/StockLedger');
const mongoose = require('mongoose');

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Private/Admin
exports.createPurchase = async (req, res) => {
  try {
    const {
      supplier,
      supplierName,
      supplierMobile,
      invoiceNo,
      invoiceDate,
      invoiceAmount,
      paidAmount,
      items,
      remarks,
      cgst,
      sgst,
      igst,
      isLocalPurchase
    } = req.body;

    if (!supplier || !items || items.length === 0) {
      throw new Error('Please provide supplier and items');
    }

    // Calculate item totals
    const calculatedAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const finalInvoiceAmount = invoiceAmount || calculatedAmount;

    // Calculate GST amounts from percentages (if not local purchase)
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let totalGst = 0;

    if (!isLocalPurchase) {
      if (cgst) cgstAmount = (finalInvoiceAmount * cgst) / 100;
      if (sgst) sgstAmount = (finalInvoiceAmount * sgst) / 100;
      if (igst) igstAmount = (finalInvoiceAmount * igst) / 100;
      totalGst = cgstAmount + sgstAmount + igstAmount;
    }

    // Create purchase (raw materials - not linked to prepared items/subcodes)
    const purchase = await Purchase.create({
      supplier,
      supplierName,
      supplierMobile,
      invoiceNo: invoiceNo || 'N/A',
      invoiceDate: invoiceDate || new Date(),
      invoiceAmount: finalInvoiceAmount,
      paidAmount: paidAmount || 0,
      items,
      remarks,
      gstAmount: totalGst,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      isLocalPurchase: isLocalPurchase || false,
      createdBy: req.user.id
    });

    // Update supplier totals (including GST in total amount)
    const totalAmountWithGst = finalInvoiceAmount + totalGst;
    if (totalAmountWithGst > 0) {
      await Supplier.findByIdAndUpdate(
        supplier,
        {
          $inc: {
            totalPurchased: totalAmountWithGst,
            totalPending: totalAmountWithGst - (paidAmount || 0)
          }
        }
      );
    }

    // Update stock for items marked as "addToStock"
    const stockUpdates = [];
    for (const item of items) {
      if (item.addToStock && item.productId) {
        try {
          // Update product stock
          const product = await SubCode.findByIdAndUpdate(
            item.productId,
            {
              $inc: { currentStock: item.quantity }
            },
            { new: true }
          );

          if (product) {
            // Create stock ledger entry
            await StockLedger.create({
              product: item.productId,
              productName: product.name,
              productCode: product.subCode,
              transactionType: 'Purchase',
              quantityChange: item.quantity,
              stockBefore: product.currentStock - item.quantity,
              stockAfter: product.currentStock,
              reference: purchase._id,
              referenceType: 'Purchase',
              referenceNo: purchase.purchaseNo,
              remarks: `Stock added from purchase ${purchase.purchaseNo}`,
              createdBy: req.user.id
            });

            stockUpdates.push({
              product: product.name,
              quantity: item.quantity,
              newStock: product.currentStock
            });
          }
        } catch (stockError) {
          console.error('Error updating stock for item:', item.itemName, stockError);
        }
      }
    }

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier', 'supplierName mobile')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: stockUpdates.length > 0
        ? `Purchase created successfully. Stock updated for ${stockUpdates.length} items.`
        : 'Purchase created successfully',
      purchase: populatedPurchase,
      stockUpdates
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private/Admin
exports.getAllPurchases = async (req, res) => {
  try {
    const { startDate, endDate, supplier, paymentStatus, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    if (supplier) filter.supplier = supplier;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const purchases = await Purchase.find(filter)
      .populate('supplier', 'supplierName mobile')
      .populate('createdBy', 'name')
      .sort({ invoiceDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Purchase.countDocuments(filter);

    res.status(200).json({
      success: true,
      count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      purchases
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private/Admin
exports.getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier')
      .populate('createdBy', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      purchase
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update purchase payment
// @route   PUT /api/purchases/:id/payment
// @access  Private/Admin
exports.updatePayment = async (req, res) => {
  try {
    const { paidAmount } = req.body;

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    const oldPaidAmount = purchase.paidAmount;
    purchase.paidAmount = paidAmount;
    await purchase.save();

    // Update supplier pending
    const difference = paidAmount - oldPaidAmount;
    await Supplier.findByIdAndUpdate(purchase.supplier, {
      $inc: { totalPending: -difference }
    });

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      purchase
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
