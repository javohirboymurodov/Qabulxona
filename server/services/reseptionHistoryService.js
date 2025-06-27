const ReceptionHistory = require('../models/ReceptionHistory');
const Employee = require('../models/Employee');
const dayjs = require('dayjs');

class ReceptionHistoryService {
  
  /**
   * Get history by date range
   */
  async getHistoryByDateRange(startDate, endDate) {
    try {
      const receptions = await ReceptionHistory.find({
        date: {
          $gte: dayjs(startDate).startOf('day').toDate(),
          $lte: dayjs(endDate).endOf('day').toDate()
        }
      }).populate('employees.employeeId', 'name position department')
        .sort({ date: -1 });

      // Flatten the data for easier frontend consumption
      const flattenedData = [];
      receptions.forEach(reception => {
        reception.employees.forEach(emp => {
          flattenedData.push({
            _id: emp._id,
            date: reception.date,
            name: emp.name || emp.employeeId?.name || 'Номаълум',
            position: emp.position || emp.employeeId?.position || '-',
            department: emp.department || emp.employeeId?.department || '-',
            phone: emp.phone || '',
            status: emp.status,
            task: emp.task,
            timeUpdated: emp.timeUpdated,
            employeeId: emp.employeeId
          });
        });
      });

      return flattenedData;
    } catch (error) {
      console.error('Get history by date range error:', error);
      throw error;
    }
  }

  /**
   * Get history by specific date
   */
  async getHistoryByDate(date) {
    try {
      const reception = await ReceptionHistory.findOne({
        date: {
          $gte: dayjs(date).startOf('day').toDate(),
          $lte: dayjs(date).endOf('day').toDate()
        }
      }).populate('employees.employeeId', 'name position department');

      if (!reception) {
        return [];
      }

      // Format response to match frontend expectations
      const formattedData = reception.employees.map(emp => ({
        _id: emp._id,
        name: emp.name || emp.employeeId?.name || 'Номаълум',
        position: emp.position || emp.employeeId?.position || '-',
        department: emp.department || emp.employeeId?.department || '-',
        phone: emp.phone || '',
        status: emp.status,
        task: emp.task,
        timeUpdated: emp.timeUpdated,
        employeeId: emp.employeeId
      }));

      return formattedData;
    } catch (error) {
      console.error('Get history by date error:', error);
      throw error;
    }
  }

  /**
   * Archive today's reception data
   */
  async archiveToday() {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      
      // Check if today's data already archived
      const existingArchive = await ReceptionHistory.findOne({
        date: {
          $gte: dayjs(today).startOf('day').toDate(),
          $lte: dayjs(today).endOf('day').toDate()
        }
      });

      if (existingArchive) {
        return {
          message: 'Бугунги маълумотлар аллақачон архивланган',
          data: existingArchive
        };
      }

      // Get all employees with their current status
      const employees = await Employee.find({ isActive: true });
      
      const archiveData = {
        date: dayjs(today).toDate(),
        employees: employees.map(emp => ({
          employeeId: emp._id,
          name: emp.name || emp.fullName,
          position: emp.position,
          department: emp.department,
          phone: emp.phone,
          status: emp.status || 'waiting',
          timeUpdated: new Date()
        }))
      };

      const newArchive = new ReceptionHistory(archiveData);
      await newArchive.save();

      return {
        message: 'Бугунги маълумотлар муваффақиятли архивланди',
        data: newArchive
      };
    } catch (error) {
      console.error('Archive today error:', error);
      throw error;
    }
  }

  /**
   * Get archive status
   */
  async getArchiveStatus() {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      
      const todayArchive = await ReceptionHistory.findOne({
        date: {
          $gte: dayjs(today).startOf('day').toDate(),
          $lte: dayjs(today).endOf('day').toDate()
        }
      });

      return {
        isArchived: !!todayArchive,
        date: today,
        archiveData: todayArchive
      };
    } catch (error) {
      console.error('Get archive status error:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a date range
   */
  async getStatistics(startDate, endDate) {
    try {
      const receptions = await ReceptionHistory.find({
        date: {
          $gte: dayjs(startDate).startOf('day').toDate(),
          $lte: dayjs(endDate).endOf('day').toDate()
        }
      });

      let totalEmployees = 0;
      let presentCount = 0;
      let absentCount = 0;
      let waitingCount = 0;

      receptions.forEach(reception => {
        reception.employees.forEach(emp => {
          totalEmployees++;
          switch (emp.status) {
            case 'present':
              presentCount++;
              break;
            case 'absent':
              absentCount++;
              break;
            case 'waiting':
              waitingCount++;
              break;
          }
        });
      });

      return {
        total: totalEmployees,
        present: presentCount,
        absent: absentCount,
        waiting: waitingCount,
        dateRange: {
          startDate,
          endDate
        }
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      throw error;
    }
  }
}

module.exports = new ReceptionHistoryService();