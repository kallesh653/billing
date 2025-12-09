const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { search, customerType, isActive, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } }
      ];
    }

    if (customerType) {
      query.customerType = customerType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customers = await Customer.find(query)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
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

// Get single customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('createdBy', 'name username');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get customer's invoice summary
    const invoices = await Invoice.find({ customer: customer._id });
    const totalInvoices = invoices.length;
    const totalPurchases = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const outstandingBalance = invoices
      .filter(inv => inv.paymentStatus !== 'Paid')
      .reduce((sum, inv) => sum + inv.balanceAmount, 0);

    res.json({
      success: true,
      data: {
        ...customer.toObject(),
        invoiceSummary: {
          totalInvoices,
          totalPurchases,
          outstandingBalance
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      createdBy: req.user._id
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Customer code already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    // Check if customer has invoices
    const invoiceCount = await Invoice.countDocuments({ customer: req.params.id });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer. ${invoiceCount} invoice(s) associated with this customer.`
      });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const totalInactive = await Customer.countDocuments({ isActive: false });

    const typeStats = await Customer.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$customerType', count: { $sum: 1 } } }
    ]);

    const topCustomers = await Customer.find({ isActive: true })
      .sort({ totalPurchases: -1 })
      .limit(10)
      .select('customerCode customerName companyName totalPurchases totalInvoices outstandingBalance');

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalInactive,
        typeStats,
        topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search customers (for autocomplete)
exports.searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const customers = await Customer.find({
      $or: [
        { customerName: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { customerCode: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .select('customerCode customerName companyName mobile email billingAddress')
    .limit(10);

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
