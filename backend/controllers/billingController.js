const Bill = require('../models/Bill');
const SubCode = require('../models/SubCode');
const StockLedger = require('../models/StockLedger');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
exports.createBill = async (req, res) => {
  try {
    const {
      items,
      customerName,
      customerMobile,
      subtotal,
      discountPercent,
      discountAmount,
      gstAmount,
      totalAmount,
      roundOff,
      grandTotal,
      paymentMode,
      paymentDetails,
      remarks
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add items to bill'
      });
    }

    if (!grandTotal || grandTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill amount'
      });
    }

    // Validate stock for items with stock tracking enabled
    for (const item of items) {
      const subCode = await SubCode.findById(item.subCode);
      if (!subCode) {
        throw new Error(`Item ${item.itemName} not found`);
      }
      // Only validate stock if stock tracking is enabled
      if (subCode.currentStock !== undefined && subCode.currentStock !== null) {
        if (subCode.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.itemName}. Available: ${subCode.currentStock}`);
        }
      }
    }

    // Generate bill number using atomic counter (prevents race conditions)
    const counter = await Counter.findOneAndUpdate(
      { key: 'bill' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!counter) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate bill number. Please try again.'
      });
    }

    const billNo = counter.seq;

    // Create bill
    const bill = await Bill.create({
      billNo,
      userId: req.user.id,
      userName: req.user.name,
      customerName,
      customerMobile,
      items,
      subtotal,
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      gstAmount: gstAmount || 0,
      totalAmount,
      roundOff: roundOff || 0,
      grandTotal,
      paymentMode,
      paymentDetails,
      remarks,
      status: 'Completed'
    });

    // Update stock and create ledger entries (only for items with stock tracking)
    for (const item of items) {
      const subCode = await SubCode.findById(item.subCode);

      // Only update stock if stock tracking is enabled
      if (subCode.currentStock !== undefined && subCode.currentStock !== null) {
        // Reduce stock
        await SubCode.findByIdAndUpdate(
          item.subCode,
          { $inc: { currentStock: -item.quantity } }
        );

        // Create stock ledger entry
        await StockLedger.create({
          itemId: item.subCode,
          itemName: item.itemName,
          transactionType: 'Sale',
          quantity: -item.quantity,
          unit: item.unit,
          rate: item.price,
          transactionDate: new Date(),
          referenceType: 'Bill',
          referenceId: bill._id,
          referenceNo: `BILL-${bill.billNo}`,
          balanceQty: subCode.currentStock - item.quantity,
          createdBy: req.user.id
        });
      }
    }

    // Populate and return bill
    const populatedBill = await Bill.findById(bill._id)
      .populate('userId', 'name username');

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      bill: populatedBill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
exports.getAllBills = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      paymentMode,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.billDate = {};
      if (startDate) filter.billDate.$gte = new Date(startDate);
      if (endDate) filter.billDate.$lte = new Date(endDate);
    }

    // User filter (if not admin, only show their bills)
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }

    if (paymentMode) filter.paymentMode = paymentMode;
    if (status) filter.status = status;

    const bills = await Bill.find(filter)
      .populate('userId', 'name username')
      .sort({ billNo: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Bill.countDocuments(filter);

    res.status(200).json({
      success: true,
      count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      bills
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('userId', 'name username');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check permission - use _id since userId is populated
    const billUserId = bill.userId._id ? bill.userId._id.toString() : bill.userId.toString();
    if (req.user.role !== 'admin' && billUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this bill'
      });
    }

    res.status(200).json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel bill
// @route   PUT /api/bills/:id/cancel
// @access  Private/Admin
exports.cancelBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      throw new Error('Bill not found');
    }

    if (bill.status === 'Cancelled') {
      throw new Error('Bill is already cancelled');
    }

    // Restore stock for items with stock tracking
    for (const item of bill.items) {
      const subCode = await SubCode.findById(item.subCode);

      // Only restore stock if stock tracking is enabled
      if (subCode && subCode.currentStock !== undefined && subCode.currentStock !== null) {
        await SubCode.findByIdAndUpdate(
          item.subCode,
          { $inc: { currentStock: item.quantity } }
        );

        // Create stock ledger entry for return
        await StockLedger.create({
          itemId: item.subCode,
          itemName: item.itemName,
          transactionType: 'Return',
          quantity: item.quantity,
          unit: item.unit,
          rate: item.price,
          transactionDate: new Date(),
          referenceType: 'Bill',
          referenceId: bill._id,
          referenceNo: `BILL-${bill.billNo}-CANCELLED`,
          balanceQty: subCode.currentStock + item.quantity,
          remarks: 'Bill cancelled',
          createdBy: req.user.id
        });
      }
    }

    bill.status = 'Cancelled';
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully',
      bill
    });
  } catch (error) {
    console.error('Cancel bill error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Mark bill as printed
// @route   PUT /api/bills/:id/print
// @access  Private
exports.markAsPrinted = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    bill.isPrinted = true;
    bill.printedAt = new Date();
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill marked as printed',
      bill
    });
  } catch (error) {
    console.error('Mark as printed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get today's bills summary
// @route   GET /api/bills/summary/today
// @access  Private
exports.getTodaySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = {
      billDate: { $gte: today },
      status: 'Completed'
    };

    // If not admin, show only their bills
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    }

    const bills = await Bill.find(filter);

    const summary = {
      totalBills: bills.length,
      totalSales: bills.reduce((sum, bill) => sum + bill.grandTotal, 0),
      cash: bills.filter(b => b.paymentMode === 'Cash').reduce((sum, bill) => sum + bill.grandTotal, 0),
      upi: bills.filter(b => b.paymentMode === 'UPI').reduce((sum, bill) => sum + bill.grandTotal, 0),
      card: bills.filter(b => b.paymentMode === 'Card').reduce((sum, bill) => sum + bill.grandTotal, 0),
      mixed: bills.filter(b => b.paymentMode === 'Mixed').reduce((sum, bill) => sum + bill.grandTotal, 0)
    };

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get today summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get bill by bill number
// @route   GET /api/bills/number/:billNo
// @access  Private
exports.getBillByNumber = async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNo: req.params.billNo })
      .populate('userId', 'name username');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
