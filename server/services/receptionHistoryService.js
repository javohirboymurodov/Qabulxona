const ReceptionHistory = require('../models/ReceptionHistory');
const Employee = require('../models/Employee');

class ReceptionHistoryService {
    async getHistoryByDateRange(startDate, endDate) {
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const history = await ReceptionHistory.find({
                date: {
                    $gte: start,
                    $lte: end
                }
            }).populate('employees.employeeId', 'name position department');

            return history.flatMap(day => 
                day.employees.map(emp => ({
                    id: emp._id,
                    name: emp.employeeId ? emp.employeeId.name : emp.name,
                    position: emp.employeeId ? emp.employeeId.position : emp.position,
                    department: emp.employeeId ? emp.employeeId.department : emp.department,
                    status: emp.status,
                    timeUpdated: emp.timeUpdated,
                    date: day.date
                }))
            );
        } catch (error) {
            console.error('Error in getHistoryByDateRange:', error);
            throw error;
        }
    }

    async getHistoryByDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        const history = await ReceptionHistory.findOne({
            date: {
                $gte: targetDate,
                $lte: endDate
            }
        }).populate('employees.employeeId', 'name position department');

        if (!history) {
            return [];
        }

        return history.employees.map(emp => ({
            id: emp._id,
            name: emp.employeeId ? emp.employeeId.name : emp.name,
            position: emp.employeeId ? emp.employeeId.position : emp.position,
            department: emp.employeeId ? emp.employeeId.department : emp.department,
            status: emp.status,
            timeUpdated: emp.timeUpdated
        }));
    }

    async archiveToday() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if already archived
            const existingArchive = await ReceptionHistory.findOne({
                date: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            });

            if (existingArchive) {
                return existingArchive.employees;
            }

            // Get employees with reception status
            const employees = await Employee.find({
                status: { $in: ['present', 'absent', 'waiting'] }
            });

            if (employees.length === 0) {
                return [];
            }

            // Create reception history record
            const receptionData = {
                date: today,
                employees: employees.map(emp => ({
                    employeeId: emp._id,
                    name: emp.name,
                    position: emp.position,
                    department: emp.department,
                    status: emp.status === 'waiting' ? 'absent' : emp.status,
                    timeUpdated: new Date()
                })),
                totalPresent: employees.filter(emp => emp.status === 'present').length,
                totalAbsent: employees.filter(emp => emp.status === 'absent' || emp.status === 'waiting').length
            };

            const history = await ReceptionHistory.create(receptionData);

            // Reset employee statuses
            await Employee.updateMany(
                { status: { $in: ['present', 'absent', 'waiting'] } },
                { $set: { status: 'waiting' } }
            );

            return history.employees;
        } catch (error) {
            console.error('Error in archiveToday:', error);
            throw error;
        }
    }

    async getArchiveStatus() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const archive = await ReceptionHistory.findOne({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        return {
            isArchived: !!archive,
            lastArchiveDate: archive ? archive.date : null
        };
    }    async scheduleAutoArchive() {
        try {
            // Get current time in Uzbekistan timezone (UTC+5)
            const now = new Date();
            const uzbekistanTime = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // UTC+5
            
            // Check if today's data has already been archived
            const today = new Date(uzbekistanTime);
            today.setHours(0, 0, 0, 0);
            
            // If it's between 00:00 and 00:05 UZB time, archive previous day's data
            const hour = uzbekistanTime.getHours();
            const minute = uzbekistanTime.getMinutes();
            
            if (hour === 0 && minute < 5) {
                const yesterdayEnd = new Date(today.getTime() - 1); // Previous day 23:59:59
                
                const existingArchive = await ReceptionHistory.findOne({
                    date: {
                        $gte: new Date(yesterdayEnd.getTime() - 24 * 60 * 60 * 1000),
                        $lt: yesterdayEnd
                    }
                });

                if (!existingArchive) {
                    console.log('Archiving previous day\'s data at:', new Date().toISOString());
                    const result = await this.archiveToday();
                    console.log('Daily archiving completed successfully');
                    return result;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error in automatic archiving:', error);
            throw error;
        }
    }
}

module.exports = new ReceptionHistoryService();
