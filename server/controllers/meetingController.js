const Meeting = require('../models/Meeting');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Telegram notification service
const getNotificationService = () => global.telegramNotificationService || null;

// Get all meetings
exports.getAllMeetings = async (req, res, next) => {
    try {
        const meetings = await Meeting.find()
            .populate('participants', 'name position department')
            .sort({ date: -1, createdAt: -1 });
        
        res.json(meetings);
    } catch (error) {
        next(error);
    }
};

// Create new meeting
exports.createMeeting = async (req, res, next) => {
    try {
        const { name, description, date, time, location, participants } = req.body; // description va location qo'shamiz

        // Ishtirokchilarni tekshirish
        if (participants && participants.length > 0) {
            const validEmployees = await Employee.find({ _id: { $in: participants } });
            if (validEmployees.length !== participants.length) {
                return res.status(400).json({ 
                    message: 'Бир ёки бир нечта иштирокчи нотўғри' 
                });
            }
        }

        const meeting = new Meeting({
            name,
            description: description || '', // Default qiymat
            date,
            time,
            location: location || '', // Default qiymat
            participants: participants || []
        });

        const newMeeting = await meeting.save();
        const populatedMeeting = await Meeting.findById(newMeeting._id)
            .populate('participants', 'name position department');

        // Add meeting to each participant's personal history
        if (participants && participants.length > 0) {
            try {
                for (const participantId of participants) {
                    const participant = await Employee.findById(participantId);
                    if (participant) {
                        await participant.addMeeting(
                            populatedMeeting._id,
                            'invited',
                            'Majlis yaratildi'
                        );
                        console.log(`Added meeting ${populatedMeeting._id} to ${participant.name}'s history (OPTIMIZED)`);
                    }
                }
            } catch (historyError) {
                console.error('Failed to add meeting to participant histories:', historyError);
                // Don't fail main operation
            }
        }

        // Send Telegram notifications to all participants
        const notificationService = getNotificationService();
        if (notificationService && participants && participants.length > 0) {
            try {
                for (const participantId of participants) {
                    await notificationService.sendMeetingNotification(participantId, {
                        name: populatedMeeting.name,
                        description: populatedMeeting.description,
                        date: populatedMeeting.date,
                        time: populatedMeeting.time,
                        location: populatedMeeting.location,
                        participants: populatedMeeting.participants
                    });
                }
                console.log(`Meeting notifications sent to ${participants.length} participants`);
            } catch (notificationError) {
                console.error('Failed to send meeting notifications:', notificationError);
                // Don't fail the main operation if notification fails
            }
        }

        res.status(201).json(populatedMeeting);
    } catch (error) {
        next(error);
    }
};

// Get meeting by ID
exports.getMeetingById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Яроқсиз мажлис ID си' });
        }

        const meeting = await Meeting.findById(id)
            .populate('participants', 'name position department');

        if (!meeting) {
            return res.status(404).json({ message: 'Мажлис топилмади' });
        }

        res.json(meeting);
    } catch (error) {
        next(error);
    }
};

// Update meeting
exports.updateMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, date, time, location, participants } = req.body; // description va location qo'shamiz

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Яроқсиз мажлис ID си' });
        }

        // Ishtirokchilarni tekshirish
        if (participants && participants.length > 0) {
            const validEmployees = await Employee.find({ _id: { $in: participants } });
            if (validEmployees.length !== participants.length) {
                return res.status(400).json({ 
                    message: 'Бир ёки бир нечта иштирокчи нотўғри' 
                });
            }
        }

        const meeting = await Meeting.findByIdAndUpdate(
            id,
            { 
                name, 
                description: description || '', // Default qiymat
                date, 
                time, 
                location: location || '', // Default qiymat
                participants 
            },
            { new: true, runValidators: true }
        ).populate('participants', 'name position department');

        if (!meeting) {
            return res.status(404).json({ message: 'Мажлис топилмади' });
        }

        // Telegram notification for meeting update
        const notificationService = global.telegramNotificationService;
        if (notificationService && participants && participants.length > 0) {
          try {
            for (const participantId of participants) {
              await notificationService.sendMeetingUpdateNotification(participantId, {
                name: meeting.name,
                description: meeting.description,
                date: meeting.date,
                time: meeting.time,
                location: meeting.location,
                action: 'updated'
              });
            }
            console.log(`📲 Meeting update notifications sent to ${participants.length} participants`);
          } catch (notificationError) {
            console.error('Failed to send meeting update notifications:', notificationError);
          }
        }

        res.json(meeting);
    } catch (error) {
        next(error);
    }
};

// Delete meeting
exports.deleteMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Мажлис кўрсатилмаган' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Яроқсиз мажлис ID си' });
        }

        // Get meeting data before deleting for notifications
        const meeting = await Meeting.findById(id).populate('participants', 'name position department');
        
        if (!meeting) {
            return res.status(404).json({ message: 'Мажлис топилмади' });
        }

        // Send telegram notifications before deleting
        const notificationService = global.telegramNotificationService;
        if (notificationService && meeting.participants && meeting.participants.length > 0) {
          try {
            for (const participant of meeting.participants) {
              await notificationService.sendMeetingCancelNotification(participant._id, {
                name: meeting.name,
                description: meeting.description,
                date: meeting.date,
                time: meeting.time,
                location: meeting.location,
                action: 'cancelled'
              });
            }
            console.log(`📲 Meeting cancellation notifications sent to ${meeting.participants.length} participants`);
          } catch (notificationError) {
            console.error('Failed to send meeting cancellation notifications:', notificationError);
          }
        }

        // Delete meeting
        await Meeting.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: 'Мажлис муваффақиятли ўчирилди' 
        });
    } catch (error) {
        next(error);
    }
};

// Get meetings by date range
exports.getMeetingsByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.params;

        const meetings = await Meeting.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
        .populate('participants', 'name position department')
        .sort('date');

        res.json(meetings);
    } catch (error) {
        next(error);
    }
};

// Get meetings by participant
exports.getMeetingsByParticipant = async (req, res, next) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ message: 'Яроқсиз иштирокчи ID си' });
        }

        const meetings = await Meeting.find({
            participants: employeeId
        })
        .populate('participants', 'name position department')
        .sort({ date: -1, createdAt: -1 });

        res.json(meetings);
    } catch (error) {
        next(error);
    }
};
