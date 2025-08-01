const express = require('express');
const router = express.Router();
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

module.exports = router;
