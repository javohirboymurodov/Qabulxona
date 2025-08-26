const ReceptionHistory = require('../models/ReceptionHistory');
const Employee = require('../models/Employee');
const dayjs = require('dayjs');

// Telegram notification service
let notificationService = null;
try {
  const { notificationService: telegramNotificationService } = require('../telegram/bot');
  notificationService = telegramNotificationService;
} catch (error) {
  console.log('Telegram bot not available for notifications');
}

/**
 * Get today's reception data
 */
exports.getTodayReception = async (req, res) => {
  try {
    const response = await ReceptionHistory.findOne({
      date: {
        $gte: dayjs().startOf('day').toDate(),
        $lte: dayjs().endOf('day').toDate()
      }
    }).populate('employees.employeeId', 'name position department');

    let receptionData = { date: dayjs().format('YYYY-MM-DD'), employees: [] };
    
    if (response) {
      // Employees arrayini timeUpdated yoki createdAt bo'yicha kamayuvchi tartibda saralamiz
      const sortedEmployees = response.employees.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timeUpdated);
        const dateB = new Date(b.createdAt || b.timeUpdated);
        return dateB - dateA; // Kamayuvchi tartib
      });
      
      receptionData = {
        ...response.toObject(),
        employees: sortedEmployees
      };
    }

    res.json({
      success: true,
      data: receptionData
    });
  } catch (error) {
    console.error('Error getting today reception:', error);
    res.status(500).json({ 
      success: false,
      message: 'Qabul ma\'lumotlarini olishda xatolik yuz berdi' 
    });
  }
};

/**
 * Add employee to reception
 */
exports.addToReception = async (req, res) => {
  try {
    const { employeeId, name, position, department, phone, status = 'waiting', task } = req.body;
    
    // Validation
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID talab qilinadi'
      });
    }

    // Employee mavjudligini tekshirish
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    const today = dayjs().format('YYYY-MM-DD');

    // Find or create today's reception
    let reception = await ReceptionHistory.findOne({
      date: {
        $gte: dayjs(today).startOf('day').toDate(),
        $lte: dayjs(today).endOf('day').toDate()
      }
    });

    if (!reception) {
      reception = new ReceptionHistory({
        date: dayjs(today).toDate(),
        employees: []
      });
    }

    // Check if employee already exists in today's reception
    const employeeIndex = reception.employees.findIndex(
      emp => emp.employeeId && emp.employeeId.toString() === employeeId.toString()
    );

    if (employeeIndex !== -1) {
      // Update existing employee
      reception.employees[employeeIndex] = {
        ...reception.employees[employeeIndex],
        status,
        task: task || reception.employees[employeeIndex].task,
        timeUpdated: new Date()
      };
    } else {
      // Add new employee
      const newEmployee = {
        employeeId: employeeId,
        name: name || employee.name || employee.fullName,
        position: position || employee.position,
        department: department || employee.department,
        phone: phone || employee.phone || '',
        status: status,
        timeUpdated: new Date(),
        createdAt: new Date()
      };

      // Add task if provided
      if (task) {
        newEmployee.task = {
          description: task.description,
          deadline: task.deadline,
          assignedAt: new Date(),
          status: 'pending'
        };
      }

      reception.employees.push(newEmployee);
    }

    await reception.save();

    // Send Telegram notification to employee
    if (notificationService && employeeIndex === -1) { // Only for new additions
      try {
        await notificationService.sendReceptionNotification(employeeId, {
          date: today,
          time: 'Белгиланган вақтда', // Default time text
          notes: task ? `Топшириқ: ${task.description}` : null
        });
        console.log(`Reception notification sent to employee ${employeeId}`);
      } catch (notificationError) {
        console.error('Failed to send reception notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Ходим қабулга муваффақиятли қўшилди',
      data: reception
    });

  } catch (error) {
    console.error('Add to reception error:', error);
    res.status(500).json({
      success: false,
      message: 'Қабулга қўшишда хатолик юз берди',
      error: error.message
    });
  }
};

/**
 * Update reception status
 */
exports.updateReceptionStatus = async (req, res) => {
  try {
    const { date, employeeId } = req.params;
    const { status, task } = req.body;
 
    console.log('Update request params:', { date, employeeId }); // Debug uchun
    console.log('Update request body:', { status, task }); // Debug uchun

    // Validation
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID talab qilinadi'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Sana talab qilinadi'
      });
    }

    const reception = await ReceptionHistory.findOne({
      date: {
        $gte: dayjs(date).startOf('day').toDate(),
        $lte: dayjs(date).endOf('day').toDate()
      }
    });

    if (!reception) {
      return res.status(404).json({
        success: false,
        message: 'Бу санада қабул топилмади'
      });
    }

    // Employee ni topish - employeeId bo'yicha yoki employeeId field bo'yicha
    const employeeIndex = reception.employees.findIndex(
      emp => {
        const empId = emp.employeeId ? emp.employeeId.toString() : emp._id.toString();
        return empId === employeeId.toString();
      }
    );

    if (employeeIndex === -1) {
      console.log('Employee not found. Available employees:', reception.employees.map(e => ({
        id: e._id,
        employeeId: e.employeeId,
        name: e.name
      })));
      
      return res.status(404).json({
        success: false,
        message: 'Ходим бу сана учун қабулда топилмади'
      });
    }

    // Update status
    reception.employees[employeeIndex].status = status;
    reception.employees[employeeIndex].timeUpdated = new Date();

    // Update task if provided
    if (task) {
      reception.employees[employeeIndex].task = {
        description: task.description,
        deadline: task.deadline,
        assignedAt: task.assignedAt || new Date(),
        status: task.status || 'pending'
      };
    }

    await reception.save();

    res.json({
      success: true,
      message: 'Ходим ҳолати муваффақиятли янгиланди',
      data: reception.employees[employeeIndex]
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Статусни янгилашда хатолик',
      error: error.message
    });
  }
};

/**
 * Get reception by date
 */
exports.getByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Сана талаб қилинади'
      });
    }

    const startDate = dayjs(date).startOf('day');
    const endDate = dayjs(date).endOf('day');

    const reception = await ReceptionHistory.findOne({
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    });

    if (!reception) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Employees arrayini createdAt bo'yicha kamayuvchi tartibda saralamiz (oxirgi qo'shilgan birinchi)
    const sortedEmployees = reception.employees.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timeUpdated);
      const dateB = new Date(b.createdAt || b.timeUpdated);
      return dateB - dateA; // Kamayuvchi tartib
    });

    res.json({
      success: true,
      data: sortedEmployees
    });

  } catch (error) {
    console.error('Get reception by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Маълумотларни олишда хатолик',
      error: error.message
    });
  }
};

/**
 * Get reception history by date range
 */
exports.getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Бошланғич ва якунланиш саналари талаб қилинади'
      });
    }

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

    res.json({
      success: true,
      data: flattenedData,
      count: flattenedData.length
    });

  } catch (error) {
    console.error('Get by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Маълумотларни олишда хатолик',
      error: error.message
    });
  }
};

/**
 * Get reception statistics
 */
exports.getReceptionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

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

    const stats = {
      total: totalEmployees,
      present: presentCount,
      absent: absentCount,
      waiting: waitingCount,
      dateRange: {
        startDate,
        endDate
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get reception stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Статистика олишда хатолик',
      error: error.message
    });
  }
};

/**
 * Archive reception data
 */
exports.archiveReceptionData = async (req, res) => {
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
      return res.json({
        success: true,
        message: 'Бугунги маълумотлар аллақачон архивланган',
        data: existingArchive
      });
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

    res.json({
      success: true,
      message: 'Бугунги маълумотлар муваффақиятли архивланди',
      data: newArchive
    });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({
      success: false,
      message: 'Архивлашда хатолик',
      error: error.message
    });
  }
};

/**
 * Get archive status
 */
exports.getArchiveStatus = async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    
    const todayArchive = await ReceptionHistory.findOne({
      date: {
        $gte: dayjs(today).startOf('day').toDate(),
        $lte: dayjs(today).endOf('day').toDate()
      }
    });

    const status = {
      isArchived: !!todayArchive,
      date: today,
      archiveData: todayArchive
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get archive status error:', error);
    res.status(500).json({
      success: false,
      message: 'Архив статусини олишда хатолик',
      error: error.message
    });
  }
};

/**
 * Update task status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { receptionId } = req.params;
    const { task } = req.body;

    if (!receptionId) {
      return res.status(400).json({
        success: false,
        message: 'Reception ID talab qilinadi'
      });
    }

    // Reception history dan employee ni topish
    const reception = await ReceptionHistory.findOne({
      'employees._id': receptionId
    });

    if (!reception) {
      return res.status(404).json({
        success: false,
        message: 'Қабул маълумоти топилмади'
      });
    }

    // Employee ni topish
    const employeeIndex = reception.employees.findIndex(
      emp => emp._id.toString() === receptionId.toString()
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    // Task statusini yangilash
    if (reception.employees[employeeIndex].task) {
      reception.employees[employeeIndex].task.status = task.status;
      reception.employees[employeeIndex].timeUpdated = new Date();
    }

    await reception.save();

    res.json({
      success: true,
      message: 'Топшириқ ҳолати муваффақиятли янгиланди',
      data: reception.employees[employeeIndex]
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Топшириқ ҳолатини янгилашда хатолик',
      error: error.message
    });
  }
};
