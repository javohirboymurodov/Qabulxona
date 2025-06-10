const Meeting = require('../models/Meeting');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

class MeetingService {    // Barcha majlislarni olish
    async getAllMeetings() {
        return await Meeting.find()
            .populate('participants', 'name position department')
            .sort({ date: -1, createdAt: -1 });
    }

    // Yangi majlis qo'shish
    async createMeeting(meetingData) {
        const { name, date, time, participants } = meetingData;

        // Ishtirokchilarni tekshirish
        if (participants && participants.length > 0) {
            const validEmployees = await Employee.find({ _id: { $in: participants } });
            if (validEmployees.length !== participants.length) {
                throw new Error('Бир ёки бир нечта иштирокчи нотўғри');
            }
        }

        const meeting = new Meeting({
            name,
            date,
            time,
            participants: participants || []
        });

        const newMeeting = await meeting.save();
        return await Meeting.findById(newMeeting._id)
            .populate('participants', 'name position department');
    }

    // Majlisni ID bo'yicha olish
    async getMeetingById(id) {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Яроқсиз мажлис ID си');
        }

        const meeting = await Meeting.findById(id)
            .populate('participants', 'name position department');
        if (!meeting) {
            throw new Error('Мажлис топилмади');
        }
        return meeting;
    }

    // Majlis ma'lumotlarini yangilash
    async updateMeeting(id, updateData) {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Яроқсиз мажлис ID си');
        }

        const { name, date, time, participants } = updateData;

        // Ishtirokchilarni tekshirish
        if (participants && participants.length > 0) {
            const validEmployees = await Employee.find({ _id: { $in: participants } });
            if (validEmployees.length !== participants.length) {
                throw new Error('Бир ёки бир нечта иштирокчи нотўғри');
            }
        }

        const meeting = await Meeting.findByIdAndUpdate(
            id,
            { name, date, time, participants },
            { new: true, runValidators: true }
        ).populate('participants', 'name position department');

        if (!meeting) {
            throw new Error('Мажлис топилмади');
        }
        return meeting;
    }

    // Sana oralig'ida majlislarni olish
    async getMeetingsByDateRange(startDate, endDate) {
        return await Meeting.find({
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
        .populate('participants', 'name position department')
        .sort('date');
    }

    // Ishtirokchiga ko'ra majlislarni olish
    async getMeetingsByParticipant(employeeId) {
        if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
            throw new Error('Яроқсиз иштирокчи ID си');
        }

        return await Meeting.find({ participants: employeeId })
            .populate('participants', 'name position department')
            .sort('-date');
    }
}

module.exports = new MeetingService();
