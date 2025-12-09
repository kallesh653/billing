const express = require('express');
const router = express.Router();
const {
  salesReport,
  itemwiseSalesReport,
  userwiseSalesReport,
  dailyCollectionReport,
  purchaseSummaryReport,
  stockReport,
  profitReport,
  supplierReport,
  stockLedgerReport
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/sales', protect, salesReport);
router.get('/itemwise-sales', protect, itemwiseSalesReport);
router.get('/userwise-sales', protect, adminOnly, userwiseSalesReport);
router.get('/daily-collection', protect, dailyCollectionReport);
router.get('/purchase-summary', protect, adminOnly, purchaseSummaryReport);
router.get('/stock', protect, adminOnly, stockReport);
router.get('/profit', protect, adminOnly, profitReport);
router.get('/supplier', protect, adminOnly, supplierReport);
router.get('/stock-ledger', protect, adminOnly, stockLedgerReport);

module.exports = router;
