const express = require('express');
const router = express.Router();
const {
  getAllSubCodes,
  getSubCodesByMainCode,
  getSubCode,
  createSubCode,
  updateSubCode,
  deleteSubCode,
  updateStock,
  getLowStockItems
} = require('../controllers/subCodeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getAllSubCodes);
router.get('/alerts/low-stock', protect, getLowStockItems);
router.get('/main/:mainCodeId', protect, getSubCodesByMainCode);
router.get('/:id', protect, getSubCode);
router.post('/', protect, adminOnly, createSubCode);
router.put('/:id', protect, adminOnly, updateSubCode);
router.put('/:id/stock', protect, adminOnly, updateStock);
router.delete('/:id', protect, adminOnly, deleteSubCode);

module.exports = router;
