const Schedule = require('../models/Schedule');
const dayjs = require('dayjs');

class ScheduleService {
    // Sana bo'yicha jadval olish
    async getScheduleByDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
        
        return await Schedule.findOne({
            date: {
                $gte: targetDate,
                $lte: endDate
            }
        });
    }

    // Jadval yaratish yoki yangilash
    async createOrUpdateSchedule(date, data) {
        const scheduleDate = new Date(date);
        scheduleDate.setHours(0, 0, 0, 0);

        return await Schedule.findOneAndUpdate(
            { date: scheduleDate },
            { 
                date: scheduleDate,
                tasks: data.tasks 
            },
            { 
                new: true, 
                upsert: true 
            }
        );
    }

    // Sana oralig'idagi jadvallarni olish
    async getSchedulesByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return await Schedule.find({
            date: {
                $gte: start,
                $lte: end
            }
        }).sort('date');
    }

    // Jadvalga yangi vazifa qo'shish
    async addTask(scheduleId, taskData) {
        return await Schedule.findByIdAndUpdate(
            scheduleId,
            { $push: { tasks: taskData } },
            { new: true }
        );
    }

    // Vazifani yangilash
    async updateTask(scheduleId, taskId, taskData) {
        return await Schedule.findOneAndUpdate(
            { 
                _id: scheduleId,
                'tasks._id': taskId 
            },
            { 
                $set: { 'tasks.$': taskData }
            },
            { new: true }
        );
    }

    // Vazifani o'chirish
    async deleteTask(scheduleId, taskId) {
        return await Schedule.findByIdAndUpdate(
            scheduleId,
            { $pull: { tasks: { _id: taskId } } },
            { new: true }
        );
    }
}

module.exports = new ScheduleService();