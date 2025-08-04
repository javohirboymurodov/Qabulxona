const express = require('express');
const router = express.Router();
const {
  getScheduleByDate,
  createSchedule,
  updateSchedule,
  checkFutureDate,
  getDailyPlan,
  saveDailyPlan
} = require('../controllers/scheduleController');

// Eski API'lar (faqat vazifalar uchun)
router.get('/:date', getScheduleByDate);
router.post('/:date', checkFutureDate, createSchedule);
router.put('/:date', checkFutureDate, updateSchedule);

// Yangi API'lar (universal kunlik reja)
router.get('/daily-plan/:date', getDailyPlan);
router.post('/daily-plan/save', checkFutureDate, saveDailyPlan);

module.exports = router;