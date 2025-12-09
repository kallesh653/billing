const MainCode = require('../models/MainCode');
const SubCode = require('../models/SubCode');

// @desc    Get all main codes
// @route   GET /api/maincodes
// @access  Private
exports.getAllMainCodes = async (req, res) => {
  try {
    const { isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const mainCodes = await MainCode.find(filter)
      .sort({ displayOrder: 1, code: 1 })
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: mainCodes.length,
      mainCodes
    });
  } catch (error) {
    console.error('Get main codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single main code
// @route   GET /api/maincodes/:id
// @access  Private
exports.getMainCode = async (req, res) => {
  try {
    const mainCode = await MainCode.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!mainCode) {
      return res.status(404).json({
        success: false,
        message: 'Main code not found'
      });
    }

    // Get sub codes count
    const subCodesCount = await SubCode.countDocuments({ mainCode: mainCode._id });

    res.status(200).json({
      success: true,
      mainCode: {
        ...mainCode.toObject(),
        subCodesCount
      }
    });
  } catch (error) {
    console.error('Get main code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create main code
// @route   POST /api/maincodes
// @access  Private/Admin
exports.createMainCode = async (req, res) => {
  try {
    const { code, name, description, displayOrder } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code and name'
      });
    }

    // Check if code already exists
    const existingCode = await MainCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Main code already exists'
      });
    }

    const mainCode = await MainCode.create({
      code: code.toUpperCase(),
      name,
      description,
      displayOrder: displayOrder || 0,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Main code created successfully',
      mainCode
    });
  } catch (error) {
    console.error('Create main code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update main code
// @route   PUT /api/maincodes/:id
// @access  Private/Admin
exports.updateMainCode = async (req, res) => {
  try {
    const { name, description, isActive, displayOrder } = req.body;

    const mainCode = await MainCode.findById(req.params.id);

    if (!mainCode) {
      return res.status(404).json({
        success: false,
        message: 'Main code not found'
      });
    }

    // Update fields
    if (name) mainCode.name = name;
    if (description !== undefined) mainCode.description = description;
    if (typeof isActive !== 'undefined') mainCode.isActive = isActive;
    if (displayOrder !== undefined) mainCode.displayOrder = displayOrder;

    await mainCode.save();

    res.status(200).json({
      success: true,
      message: 'Main code updated successfully',
      mainCode
    });
  } catch (error) {
    console.error('Update main code error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete main code
// @route   DELETE /api/maincodes/:id
// @access  Private/Admin
exports.deleteMainCode = async (req, res) => {
  try {
    const mainCode = await MainCode.findById(req.params.id);

    if (!mainCode) {
      return res.status(404).json({
        success: false,
        message: 'Main code not found'
      });
    }

    // Check if any sub codes exist
    const subCodesCount = await SubCode.countDocuments({ mainCode: mainCode._id });

    if (subCodesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete main code. ${subCodesCount} sub code(s) exist under this main code.`
      });
    }

    await mainCode.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Main code deleted successfully'
    });
  } catch (error) {
    console.error('Delete main code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get main codes with sub codes count
// @route   GET /api/maincodes/with-count
// @access  Private
exports.getMainCodesWithCount = async (req, res) => {
  try {
    const mainCodes = await MainCode.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'subcodes',
          localField: '_id',
          foreignField: 'mainCode',
          as: 'subCodes'
        }
      },
      {
        $project: {
          code: 1,
          name: 1,
          description: 1,
          displayOrder: 1,
          subCodesCount: { $size: '$subCodes' }
        }
      },
      { $sort: { displayOrder: 1, code: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: mainCodes.length,
      mainCodes
    });
  } catch (error) {
    console.error('Get main codes with count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
