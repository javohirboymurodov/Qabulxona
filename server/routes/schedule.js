const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// Sana oralig'idagi jadvallarni olish
router.get('/range/:startDate/:endDate', scheduleController.getSchedulesByDateRange);

// Kunlik jadval olish
router.get('/:date', scheduleController.getScheduleByDate);

// Jadval yaratish
router.post('/:date', scheduleController.createSchedule);

// Jadval yangilash
router.put('/:date', scheduleController.createSchedule);

module.exports = router;