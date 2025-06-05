const meetingService = require('../services/meetingService');

// Get all meetings
exports.getAllMeetings = async (req, res, next) => {
    try {
        const meetings = await meetingService.getAllMeetings();
        res.json(meetings);
    } catch (error) {
        next(error);
    }
};

// Create new meeting
exports.createMeeting = async (req, res, next) => {
    try {
        const meeting = await meetingService.createMeeting(req.body);
        res.status(201).json(meeting);
    } catch (error) {
        next(error);
    }
};

// Get meeting by ID
exports.getMeetingById = async (req, res, next) => {
    try {
        const meeting = await meetingService.getMeetingById(req.params.id);
        res.json(meeting);
    } catch (error) {
        next(error);
    }
};

// Update meeting
exports.updateMeeting = async (req, res, next) => {
    try {
        const meeting = await meetingService.updateMeeting(req.params.id, req.body);
        res.json(meeting);
    } catch (error) {
        next(error);
    }
};

// Delete meeting
exports.deleteMeeting = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: 'Majlis ID si ko\'rsatilmagan' });
        }
        const result = await meetingService.deleteMeeting(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Yaroqsiz majlis ID si' || error.message === 'Majlis topilmadi') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

// Get meetings by date range
exports.getMeetingsByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.params;
        const meetings = await meetingService.getMeetingsByDateRange(startDate, endDate);
        res.json(meetings);
    } catch (error) {
        next(error);
    }
};

// Get meetings by participant
exports.getMeetingsByParticipant = async (req, res, next) => {
    try {
        const meetings = await meetingService.getMeetingsByParticipant(req.params.employeeId);
        res.json(meetings);
    } catch (error) {
        next(error);
    }
};
