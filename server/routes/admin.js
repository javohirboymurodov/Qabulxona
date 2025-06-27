const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Role = require('../models/Role');
const { protect } = require('../middleware/auth');

// Get all admins
router.get('/', protect, async (req, res) => {
  try {
    const admins = await Admin.find().populate('role').select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Админларни юклашда хатолик юз берди' 
    });
  }
});

// Create new admin
router.post('/', protect, async (req, res) => {
  try {
    const { username, password, fullName, role: roleName } = req.body;

    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Бундай логин мавжуд'
      });
    }

    // Get role
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Нотўғри роль танланган'
      });
    }

    const admin = await Admin.create({
      username,
      password,
      fullName,
      role: role._id
    });

    res.status(201).json({
      success: true,
      data: {
        ...admin.toObject(),
        password: undefined
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Админ яратишда хатолик юз берди'
    });
  }
});

// Update admin
router.put('/:id', protect, async (req, res) => {
  try {
    const { username, fullName, role: roleName } = req.body;
    
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Нотўғри роль танланган'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { username, fullName, role: role._id },
      { new: true }
    ).populate('role');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Админ топилмади'
      });
    }

    res.json({
      success: true,
      data: admin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Админни янгилашда хатолик юз берди'
    });
  }
});

module.exports = router;