const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  changePassword
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', protect, adminOnly, register);
router.get('/me', protect, getMe);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/change-password', protect, changePassword);

module.exports = router;
