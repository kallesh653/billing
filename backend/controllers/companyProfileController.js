const CompanyProfile = require('../models/CompanyProfile');
const fs = require('fs');
const path = require('path');

// Get company profile
exports.getCompanyProfile = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true })
      .populate('updatedBy', 'name username');

    // If no profile exists, create a default one
    if (!profile) {
      profile = await CompanyProfile.create({
        companyName: 'Your Company Name',
        email: 'info@company.com',
        phone: '+91 1234567890',
        address: {
          addressLine1: 'Address Line 1',
          city: 'City',
          state: 'State',
          country: 'India',
          pincode: '000000'
        },
        isActive: true
      });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update company profile
exports.updateCompanyProfile = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      profile = new CompanyProfile({ ...req.body, isActive: true });
    } else {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key]) && req.body[key] !== null) {
          profile[key] = { ...profile[key], ...req.body[key] };
        } else {
          profile[key] = req.body[key];
        }
      });
    }

    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: profile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload company logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({ success: false, message: 'No logo file uploaded' });
    }

    const logo = req.files.logo;
    const uploadDir = path.join(__dirname, '..', 'uploads', 'company');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `logo_${Date.now()}${path.extname(logo.name)}`;
    const filePath = path.join(uploadDir, fileName);

    await logo.mv(filePath);

    let profile = await CompanyProfile.findOne({ isActive: true });
    if (!profile) {
      profile = new CompanyProfile({ isActive: true });
    }

    // Delete old logo if exists
    if (profile.logo && fs.existsSync(profile.logo)) {
      fs.unlinkSync(profile.logo);
    }

    profile.logo = filePath;
    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logoPath: filePath }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update invoice settings
exports.updateInvoiceSettings = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create profile first.'
      });
    }

    profile.invoiceSettings = { ...profile.invoiceSettings, ...req.body };
    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Invoice settings updated successfully',
      data: profile.invoiceSettings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update tax settings
exports.updateTaxSettings = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create profile first.'
      });
    }

    profile.taxSettings = { ...profile.taxSettings, ...req.body };
    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Tax settings updated successfully',
      data: profile.taxSettings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update homepage content
exports.updateHomepage = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create profile first.'
      });
    }

    profile.homepage = { ...profile.homepage, ...req.body };
    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Homepage content updated successfully',
      data: profile.homepage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add/Update product for homepage
exports.addProduct = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found. Please create profile first.'
      });
    }

    const { name, category, description, price, image, features, order } = req.body;

    if (!profile.products) {
      profile.products = [];
    }

    profile.products.push({
      name,
      category,
      description,
      price,
      image,
      features,
      order: order || profile.products.length + 1,
      isActive: true
    });

    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Product added successfully',
      data: profile.products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.'
      });
    }

    const productIndex = profile.products.findIndex(p => p._id.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    profile.products[productIndex] = {
      ...profile.products[productIndex].toObject(),
      ...req.body
    };

    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: profile.products[productIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    let profile = await CompanyProfile.findOne({ isActive: true });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.'
      });
    }

    profile.products = profile.products.filter(p => p._id.toString() !== productId);
    profile.updatedBy = req.user._id;
    await profile.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get public company info (for homepage - no auth required)
exports.getPublicInfo = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ isActive: true })
      .select('companyName tagline logo email phone website address socialMedia homepage products');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Company information not available'
      });
    }

    // Filter only active products
    const activeProducts = profile.products ? profile.products.filter(p => p.isActive) : [];

    res.json({
      success: true,
      data: {
        ...profile.toObject(),
        products: activeProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
