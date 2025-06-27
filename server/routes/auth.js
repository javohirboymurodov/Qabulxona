const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  login,
  refreshToken,
  checkAuth,
  logout,
  changePassword
} = require('../controllers/authController');

router.post('/login', login); // Rate limiting olib tashlandi
router.post('/refresh-token', refreshToken);
router.get('/check', protect, checkAuth);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;