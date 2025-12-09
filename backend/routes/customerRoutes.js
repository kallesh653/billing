const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  searchCustomers
} = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All customer routes require authentication
router.use(protect);

// Search customers (autocomplete)
router.get('/search', searchCustomers);

// Statistics
router.get('/stats', getCustomerStats);

// CRUD operations
router.route('/')
  .get(getAllCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(adminOnly, deleteCustomer);

module.exports = router;
