const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getAllPurchases,
  getPurchase,
  updatePayment
} = require('../controllers/purchaseController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, createPurchase);
router.get('/', protect, adminOnly, getAllPurchases);
router.get('/:id', protect, adminOnly, getPurchase);
router.put('/:id/payment', protect, adminOnly, updatePayment);

module.exports = router;
