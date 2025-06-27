// filepath: c:\Users\Lenovo Ryzen 7\Desktop\Qabulxona\server\middleware\auth.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен топилмади. Тизимга киринг',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.id).populate('role').select('-password');
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Фойдаланувчи топилмади',
        });
      }

      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Ҳисобингиз фаол эмас',
        });
      }

      req.admin = admin;
      next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Токен муддати тугаган',
          expired: true,
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Нотўғри токен',
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Авторизация хатолиги',
    });
  }
};

module.exports = { protect };