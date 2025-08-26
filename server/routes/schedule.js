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

// Apply authentication to all routes
router.use(protect);

// Existing routes
router.use(checkFutureDate);
router.get('/:date', getScheduleByDate);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);

// Daily plan routes
router.get('/daily-plan/:date', getDailyPlan);
router.post('/daily-plan', saveDailyPlan); // Route qo'shish

// PDF generation route
router.get('/pdf/:date', generateDailyPlanPDF);

module.exports = router;