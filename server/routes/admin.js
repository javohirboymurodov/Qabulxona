const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
// const Role = require('../models/Role'); // Role modeli olib tashlandi
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Adminlar boshqaruvi
 */

/**
 * @swagger
 * /api/admins:
 *   get:
 *     summary: Barcha adminlarni olish
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Adminlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password'); // populate('role') olib tashlandi
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Админларни юклашда хатолик юз берди' 
    });
  }
});

/**
 * @swagger
 * /api/admins:
 *   post:
 *     summary: Yangi admin yaratish
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - fullName
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: Foydalanuvchi nomi
 *               password:
 *                 type: string
 *                 description: Parol
 *               fullName:
 *                 type: string
 *                 description: To'liq ismi
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin]
 *                 description: Admin roli
 *     responses:
 *       201:
 *         description: Admin muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Бундай логин мавжуд'
      });
    }

    // Role string enum tekshiruvi
    if (!['super_admin', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Нотўғри роль танланган'
      });
    }

    const admin = await Admin.create({
      username,
      password,
      fullName,
      role
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

/**
 * @swagger
 * /api/admins/{id}:
 *   put:
 *     summary: Admin ma'lumotlarini yangilash
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullName
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: Foydalanuvchi nomi
 *               fullName:
 *                 type: string
 *                 description: To'liq ismi
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin]
 *                 description: Admin roli
 *     responses:
 *       200:
 *         description: Admin ma'lumotlari yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Admin topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { username, fullName, role } = req.body;
    if (!['super_admin', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Нотўғри роль танланган'
      });
    }
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { username, fullName, role },
      { new: true }
    );
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