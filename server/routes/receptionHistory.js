const express = require('express');
const router = express.Router();
const ReceptionHistory = require('../models/ReceptionHistory');
const dayjs = require('dayjs'); // Bu import bo'lishi kerak
const { protect } = require('../middleware/auth');
const {
  addToReception,
  updateReceptionStatus,
  updateReceptionEmployee,
  getByDate,
  getByDateRange,
  getTodayReception,
  getReceptionStats,
  updateTaskStatus
} = require('../controllers/receptionHistoryController');

/**
 * @swagger
 * tags:
 *   name: Reception History
 *   description: Qabul tarixi boshqaruvi
 */

/**
 * @swagger
 * /api/reception-history/today:
 *   get:
 *     summary: Bugungi qabullarni olish
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bugungi qabullar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReceptionHistory'
 */
router.use(protect);
router.get('/today', getTodayReception);

/**
 * @swagger
 * /api/reception-history/add:
 *   post:
 *     summary: Xodimni qabulga qo'shish
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - name
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: Xodim ID
 *               name:
 *                 type: string
 *                 description: Xodim ismi
 *               position:
 *                 type: string
 *                 description: Lavozimi
 *               department:
 *                 type: string
 *                 description: Bo'lim
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *               scheduledTime:
 *                 type: string
 *                 description: Belgilangan vaqt
 *               status:
 *                 type: string
 *                 enum: [waiting, present, absent]
 *                 description: Holat
 *     responses:
 *       200:
 *         description: Xodim qabulga qo'shildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/add', addToReception);

/**
 * @swagger
 * /api/reception-history/stats:
 *   get:
 *     summary: Qabul statistikalarini olish
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Qabul statistikalari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     waiting:
 *                       type: number
 *                     present:
 *                       type: number
 *                     absent:
 *                       type: number
 */
router.get('/stats', getReceptionStats);

/**
 * @swagger
 * /api/reception-history/date/{date}:
 *   get:
 *     summary: Belgilangan sanadagi qabullarni olish
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Qabul sanasi
 *     responses:
 *       200:
 *         description: Sanadagi qabullar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReceptionHistory'
 */
router.get('/date/:date', getByDate);

/**
 * @swagger
 * /api/reception-history/range/{startDate}/{endDate}:
 *   get:
 *     summary: Sana oralig'idagi qabullarni olish
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Boshlanish sanasi
 *       - in: path
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tugash sanasi
 *     responses:
 *       200:
 *         description: Sana oralig'idagi qabullar
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
 *                     $ref: '#/components/schemas/ReceptionHistory'
 */
router.get('/range/:startDate/:endDate', getByDateRange);

/**
 * @swagger
 * /api/reception-history/{date}/employee/{employeeId}/status:
 *   put:
 *     summary: Xodim qabul holatini yangilash
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Qabul sanasi
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waiting, present, absent]
 *                 description: Yangi holat
 *     responses:
 *       200:
 *         description: Xodim holati yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/:date/employee/:employeeId/status', updateReceptionStatus);

/**
 * @swagger
 * /api/reception-history/{date}/employee/{employeeId}:
 *   put:
 *     summary: Xodim qabul ma'lumotlarini yangilash
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Qabul sanasi
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Xodim ismi
 *               position:
 *                 type: string
 *                 description: Lavozimi
 *               department:
 *                 type: string
 *                 description: Bo'lim
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *               scheduledTime:
 *                 type: string
 *                 description: Belgilangan vaqt
 *     responses:
 *       200:
 *         description: Xodim ma'lumotlari yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/:date/employee/:employeeId', updateReceptionEmployee);

/**
 * @swagger
 * /api/reception-history/task/{receptionId}/status:
 *   put:
 *     summary: Topshiriq holatini yangilash
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Qabul ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, overdue]
 *                 description: Yangi holat
 *     responses:
 *       200:
 *         description: Topshiriq holati yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/task/:receptionId/status', updateTaskStatus);

/**
 * @swagger
 * /api/reception-history/{date}:
 *   get:
 *     summary: Belgilangan sanadagi qabullarni olish (legacy)
 *     tags: [Reception History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Qabul sanasi
 *     responses:
 *       200:
 *         description: Sanadagi qabullar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReceptionHistory'
 */
router.get('/:date', getByDate);

// Agar mavjud bo'lmasa qo'shing:
router.post('/add-employee', async (req, res) => {
  try {
    console.log('=== BACKEND Add Employee START ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    // Request body'dan to'g'ri ma'lumotni olish
    const employeeData = req.body.employeeId ? req.body : req.body.employee;
    
    console.log('Processed employee data:', JSON.stringify(employeeData, null, 2));
    
    if (!employeeData || !employeeData.employeeId) {
      console.log('=== VALIDATION ERROR: Missing employee data ===');
      return res.status(400).json({
        success: false,
        message: 'Employee ma\'lumotlari to\'liq emas'
      });
    }

    // Agar scheduledDate berilgan bo'lsa (DailyPlan uchun), aks holda bugungi sana
    const targetDate = employeeData.scheduledDate || employeeData.date || dayjs().format('YYYY-MM-DD');
    
    console.log('Target date for reception:', targetDate);
    console.log('Date query range:', {
      start: dayjs(targetDate).startOf('day').toDate(),
      end: dayjs(targetDate).endOf('day').toDate()
    });
    
    // Target date uchun reception history topish yoki yaratish
    let receptionHistory = await ReceptionHistory.findOne({
      date: {
        $gte: dayjs(targetDate).startOf('day').toDate(),
        $lte: dayjs(targetDate).endOf('day').toDate()
      }
    });

    console.log('Existing reception history found:', !!receptionHistory);
    if (receptionHistory) {
      console.log('Existing employees count:', receptionHistory.employees.length);
    }

    if (!receptionHistory) {
      console.log('Creating new reception history');
      receptionHistory = new ReceptionHistory({
        date: dayjs(targetDate).toDate(),
        employees: []
      });
    }

    // Employee allaqachon qo'shilganligini tekshirish
    const existingEmployee = receptionHistory.employees.find(
      emp => emp.employeeId === employeeData.employeeId
    );

    if (existingEmployee) {
      console.log('=== DUPLICATE ERROR: Employee already exists ===');
      return res.status(400).json({
        success: false,
        message: 'Bu ходим аллақачон қабулга қўшилган'
      });
    }

    // Employee qo'shish
    const newEmployee = {
      employeeId: employeeData.employeeId,
      name: employeeData.name,
      position: employeeData.position || '',
      department: employeeData.department || '',
      phone: employeeData.phone || '',
      status: employeeData.status || 'waiting',
      scheduledTime: employeeData.scheduledTime || employeeData.time || dayjs().format('HH:mm'), // Asosiy qabul vaqti (xodim keladigan vaqt)
      timeUpdated: new Date(),
      createdAt: new Date()
    };
    
    console.log('Adding new employee:', JSON.stringify(newEmployee, null, 2));
    
    receptionHistory.employees.push(newEmployee);
    const savedHistory = await receptionHistory.save();

    // Add to employee's personal reception history
    const Employee = require('../models/Employee');
    try {
      const employee = await Employee.findById(employeeData.employeeId);
      if (employee) {
        await employee.addReception(
          savedHistory._id, // receptionId - birinchi parametr
          dayjs(targetDate).toDate(), // date - ikkinchi parametr
          employeeData.scheduledTime || employeeData.time || dayjs().format('HH:mm'), // time - uchinchi parametr
          'waiting', // status - to'rtinchi parametr
          employeeData.notes || null // notes - beshinchi parametr
        );
        console.log(`Added reception to employee ${employee.name}'s personal history`);
      }
    } catch (historyError) {
      console.error('Failed to add reception to employee history:', historyError);
      // Don't fail main operation
    }

    // Send Telegram notification to employee
    const getNotificationService = () => global.telegramNotificationService || null;
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.sendReceptionNotification(employeeData.employeeId, {
          date: targetDate,
          time: employeeData.scheduledTime || employeeData.time || dayjs().format('HH:mm'),
          notes: employeeData.task ? `Топшириқ: ${employeeData.task.description}` : null
        });
        console.log(`Reception notification sent to employee ${employeeData.employeeId}`);
      } catch (notificationError) {
        console.error('Failed to send reception notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    console.log('=== BACKEND SUCCESS ===');
    console.log('Saved reception history ID:', savedHistory._id);
    console.log('Total employees after save:', savedHistory.employees.length);

    res.json({
      success: true,
      message: `Employee ${targetDate} санасидаги қабулга қўшилди`,
      data: savedHistory
    });

  } catch (error) {
    console.error('=== BACKEND ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      message: 'Қабулга қўшишда хатолик',
      error: error.message
    });
  }
});

module.exports = router;
