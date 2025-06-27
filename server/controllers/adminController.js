const Admin = require('../models/Admin');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');

exports.createAdmin = async (req, res) => {
  try {
    // Faqat Super Admin yangi admin yarata oladi
    if (!req.admin.role.permissions.includes('manage_admins')) {
      return res.status(403).json({
        success: false,
        message: 'Админ яратиш учун рухсат йўқ'
      });
    }

    const newAdmin = await Admin.create({
      ...req.body,
      createdBy: req.admin._id
    });

    res.status(201).json({
      success: true,
      data: newAdmin
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};