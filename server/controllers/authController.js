const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generate JWT token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  
  return jwt.sign({ id }, refreshSecret, {
    expiresIn: '7d',
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Фойдаланувчи номи ва паролни киритинг',
      });
    }

    // Check if JWT secrets are configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('JWT secrets are not configured properly');
      return res.status(500).json({
        success: false,
        message: 'Сервер конфигурацияси хатолиги',
      });
    }

    // Find admin with password field
    const admin = await Admin.findOne({ username }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Нотўғри фойдаланувчи номи ёки парол',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Ҳисобингиз фаол эмас. Администратор билан боғланинг',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Нотўғри фойдаланувчи номи ёки парол',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const token = generateToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);

    console.log('Login successful for user:', admin.username);

    res.json({
      success: true,
      message: 'Муваффақиятли кирдингиз',
      token,
      refreshToken,
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Сервер хатолиги',
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token топилмади',
      });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      return res.status(500).json({
        success: false,
        message: 'Сервер конфигурацияси хатолиги',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Нотўғри токен',
      });
    }

    // Generate new access token
    const newToken = generateToken(admin._id);

    res.json({
      success: true,
      token: newToken,
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Нотўғри ёки эскирган токен',
    });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Фойдаланувчи топилмади',
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (error) {
    console.error('CheckAuth error:', error);
    res.status(401).json({
      success: false,
      message: 'Авторизация хатолиги',
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Муваффақиятли чиқдингиз',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Чиқишда хатолик',
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Жорий ва янги паролни киритинг',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Янги парол камида 6 та белгидан иборат бўлиши керак',
      });
    }

    // Get admin with password
    const admin = await Admin.findById(adminId).select('+password');
    
    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Жорий парол нотўғри',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Парол муваффақиятли ўзгартирилди',
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Паролни ўзгартиришда хатолик',
    });
  }
};