const express = require('express');
const router = express.Router();
const {
  getAllMainCodes,
  getMainCode,
  createMainCode,
  updateMainCode,
  deleteMainCode,
  getMainCodesWithCount
} = require('../controllers/mainCodeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getAllMainCodes);
router.get('/with-count', protect, getMainCodesWithCount);
router.get('/:id', protect, getMainCode);
router.post('/', protect, adminOnly, createMainCode);
router.put('/:id', protect, adminOnly, updateMainCode);
router.delete('/:id', protect, adminOnly, deleteMainCode);

module.exports = router;
