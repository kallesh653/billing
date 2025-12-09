const express = require('express');
const router = express.Router();
const {
  createBill,
  getAllBills,
  getBill,
  cancelBill,
  markAsPrinted,
  getTodaySummary,
  getBillByNumber
} = require('../controllers/billingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createBill);
router.get('/', protect, getAllBills);
router.get('/summary/today', protect, getTodaySummary);
router.get('/number/:billNo', protect, getBillByNumber);
router.get('/:id', protect, getBill);
router.put('/:id/cancel', protect, adminOnly, cancelBill);
router.put('/:id/print', protect, markAsPrinted);

module.exports = router;
