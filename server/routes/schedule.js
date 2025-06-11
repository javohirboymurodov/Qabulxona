const express = require('express');
const router = express.Router();
const {
  getScheduleByDate,
  createSchedule,
  updateSchedule,
  checkFutureDate
} = require('../controllers/scheduleController');

// GET - Barcha kunlar uchun
router.get('/:date', getScheduleByDate);

// POST - Faqat bugungi va kelasi kunlar uchun
router.post('/:date', checkFutureDate, createSchedule);

// PUT - Faqat bugungi va kelasi kunlar uchun
router.put('/:date', checkFutureDate, updateSchedule);

module.exports = router;