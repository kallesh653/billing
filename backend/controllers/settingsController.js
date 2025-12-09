const BusinessSettings = require('../models/BusinessSettings');

// @desc    Get business settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await BusinessSettings.create({
        shopName: 'Juicy',
        updatedBy: req.user.id
      });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update business settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = await BusinessSettings.create({
        ...req.body,
        updatedBy: req.user.id
      });
    } else {
      settings = await BusinessSettings.findOneAndUpdate(
        {},
        { ...req.body, updatedBy: req.user.id },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
