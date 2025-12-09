const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getAllSuppliers);
router.post('/', protect, adminOnly, createSupplier);
router.put('/:id', protect, adminOnly, updateSupplier);
router.delete('/:id', protect, adminOnly, deleteSupplier);

module.exports = router;
