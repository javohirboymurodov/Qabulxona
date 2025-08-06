const express = require('express');
const router = express.Router();
const {
  checkFutureDate,
  getScheduleByDate,
  createSchedule,
  updateSchedule,
  getDailyPlan,
  saveDailyPlan // Import qo'shish
} = require('../controllers/scheduleController');

// Existing routes
router.use(checkFutureDate);
router.get('/:date', getScheduleByDate);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);

// Daily plan routes
router.get('/daily-plan/:date', getDailyPlan);
router.post('/daily-plan', saveDailyPlan); // Route qo'shish

module.exports = router;