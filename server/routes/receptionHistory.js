const express = require('express');
const router = express.Router();
const ReceptionHistory = require('../models/ReceptionHistory');
const dayjs = require('dayjs'); // Bu import bo'lishi kerak
const { protect } = require('../middleware/auth');
const {
  addToReception,
  updateReceptionStatus,
  getByDate,
  getByDateRange,
  getTodayReception,
  getReceptionStats,
  updateTaskStatus
} = require('../controllers/receptionHistoryController');

// All routes require authentication
router.use(protect);

// Get today's reception
router.get('/today', getTodayReception);

// Add employee to reception
router.post('/add', addToReception);

// Get reception statistics
router.get('/stats', getReceptionStats);

// Get reception by date
router.get('/date/:date', getByDate);

// Get reception history by date range
router.get('/range/:startDate/:endDate', getByDateRange);

// Update employee status in reception
router.put('/:date/employee/:employeeId/status', updateReceptionStatus);

// Task status yangilash
router.put('/task/:receptionId/status', updateTaskStatus);

// Legacy route support
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
      scheduledTime: employeeData.time || dayjs().format('HH:mm'), // Qabul vaqti
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
        await employee.addReception({
          date: dayjs(targetDate).toDate(),
          time: employeeData.time || dayjs().format('HH:mm'),
          status: 'waiting',
          notes: employeeData.notes || null
        });
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
          time: employeeData.time || dayjs().format('HH:mm'),
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
