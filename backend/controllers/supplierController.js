const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
exports.getAllSuppliers = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const suppliers = await Supplier.find(filter).sort({ supplierName: 1 });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private/Admin
exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Supplier created', supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, message: 'Supplier updated', supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
