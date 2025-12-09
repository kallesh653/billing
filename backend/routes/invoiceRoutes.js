const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  addPayment,
  getInvoiceStats,
  generatePDF
} = require('../controllers/invoiceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All invoice routes require authentication
router.use(protect);

// Statistics
router.get('/stats', getInvoiceStats);

// PDF generation
router.get('/:id/pdf', generatePDF);

// Update status
router.put('/:id/status', updateInvoiceStatus);

// Add payment
router.post('/:id/payment', addPayment);

// CRUD operations
router.route('/')
  .get(getAllInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(adminOnly, deleteInvoice);

module.exports = router;
