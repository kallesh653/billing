const express = require('express');
const router = express.Router();
const {
  getCompanyProfile,
  updateCompanyProfile,
  uploadLogo,
  updateInvoiceSettings,
  updateTaxSettings,
  updateHomepage,
  addProduct,
  updateProduct,
  deleteProduct,
  getPublicInfo
} = require('../controllers/companyProfileController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public route (no authentication)
router.get('/public', getPublicInfo);

// All other routes require authentication
router.use(protect);

// Company profile
router.route('/')
  .get(getCompanyProfile)
  .put(adminOnly, updateCompanyProfile);

// Logo upload (admin only)
router.post('/logo', adminOnly, uploadLogo);

// Invoice settings (admin only)
router.put('/invoice-settings', adminOnly, updateInvoiceSettings);

// Tax settings (admin only)
router.put('/tax-settings', adminOnly, updateTaxSettings);

// Homepage content (admin only)
router.put('/homepage', adminOnly, updateHomepage);

// Products management (admin only)
router.post('/products', adminOnly, addProduct);
router.put('/products/:productId', adminOnly, updateProduct);
router.delete('/products/:productId', adminOnly, deleteProduct);

module.exports = router;
