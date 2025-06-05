const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

// Get all meetings and meetings by date range
router.get('/', meetingController.getAllMeetings);
router.get('/range/:startDate/:endDate', meetingController.getMeetingsByDateRange);
router.get('/participant/:employeeId', meetingController.getMeetingsByParticipant);

// Get single meeting
router.get('/:id', meetingController.getMeetingById);

// Create new meeting
router.post('/', meetingController.createMeeting);

// Update meeting
router.put('/:id', meetingController.updateMeeting);

// Delete meeting
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;
