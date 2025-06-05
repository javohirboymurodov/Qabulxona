const express = require('express');
const router = express.Router();
const receptionHistoryController = require('../controllers/receptionHistoryController');

// Get reception statistics
router.get('/stats', receptionHistoryController.getReceptionStats);

// Get current archive status
router.get('/archive/status', receptionHistoryController.getArchiveStatus);

// Archive current day's reception and create history
router.post('/archive-day', receptionHistoryController.archiveReceptionData);

// Force archive current reception data
router.post('/archive/force', receptionHistoryController.forceArchive);

// Get reception history for a date range
router.get('/', receptionHistoryController.getReceptionHistory);

// Get reception history for a specific date
router.get('/:date', receptionHistoryController.getHistoryByDate);

module.exports = router;
