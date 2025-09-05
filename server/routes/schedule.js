const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  checkFutureDate,
  getScheduleByDate,
  createSchedule,
  updateSchedule,
  getDailyPlan,
  saveDailyPlan, // Import qo'shish
  generateDailyPlanPDF
} = require('../controllers/scheduleController');

/**
 * @swagger
 * tags:
 *   name: Schedule
 *   description: Jadval va kunlik reja boshqaruvi
 */

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * /api/schedule/{date}:
 *   get:
 *     summary: Belgilangan sanadagi jadvalni olish
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Jadval sanasi
 *     responses:
 *       200:
 *         description: Jadval ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 */
router.use(checkFutureDate);
router.get('/:date', getScheduleByDate);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Yangi jadval yaratish
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Jadval muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/', createSchedule);

/**
 * @swagger
 * /api/schedule/{id}:
 *   put:
 *     summary: Jadvalni yangilash
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Jadval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Jadval yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/:id', updateSchedule);

/**
 * @swagger
 * /api/schedule/daily-plan/{date}:
 *   get:
 *     summary: Kunlik rejani olish
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Reja sanasi
 *     responses:
 *       200:
 *         description: Kunlik reja
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 */
router.get('/daily-plan/:date', getDailyPlan);

/**
 * @swagger
 * /api/schedule/daily-plan:
 *   post:
 *     summary: Kunlik rejani saqlash
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Kunlik reja saqlandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/daily-plan', saveDailyPlan);

/**
 * @swagger
 * /api/schedule/pdf/{date}:
 *   get:
 *     summary: Kunlik reja PDF faylini olish
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Reja sanasi
 *     responses:
 *       200:
 *         description: PDF fayl
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/pdf/:date', generateDailyPlanPDF);

module.exports = router;