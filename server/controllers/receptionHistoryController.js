const ReceptionHistory = require('../models/ReceptionHistory');
const Employee = require('../models/Employee');
const dayjs = require('dayjs');

// Telegram notification service
const getNotificationService = () => global.telegramNotificationService || null;

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
    const { employeeId, name, position, department, phone, status = 'waiting', task, scheduledTime } = req.body;
    
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
        scheduledTime: scheduledTime || reception.employees[employeeIndex].scheduledTime || dayjs().format('HH:mm'), // Asosiy qabul vaqti
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
        scheduledTime: scheduledTime || dayjs().format('HH:mm'), // Asosiy qabul vaqti (xodim keladigan vaqt)
        timeUpdated: new Date(), // Yangilangan vaqt
        createdAt: new Date() // Ma'lumot yaratilgan vaqt
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
    const notificationService = getNotificationService();
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

    // Reception'ni topish
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

    // Employee ni topish
    const employeeIndex = reception.employees.findIndex(
      emp => {
        const empId = emp.employeeId ? emp.employeeId.toString() : emp._id.toString();
        const searchId = employeeId.toString();
        return empId === searchId;
      }
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ходим бу сана учун қабулда топилмади'
      });
    }

    // Vaqt cheklovlarini tekshirish - faqat status o'zgartirishda
    // Vazifa berishda vaqt cheklovi bo'lmasligi kerak
    if (!task) { // Agar vazifa berilmasa, faqat status o'zgartirilayotgan bo'lsa
      const targetDate = dayjs(date);
      const now = dayjs();
      
      // O'tgan kunlarni tahrirlab bo'lmaydi
      if (targetDate.isBefore(now, 'day')) {
        return res.status(403).json({
          success: false,
          message: 'Ўтган кунларни таҳрирлаб бўлмайди'
        });
      }

      // Bugungi kun uchun - eng kamida 1 soat qolganda tahrirlash mumkin
      if (targetDate.isSame(now, 'day')) {
        const scheduledTime = reception.employees[employeeIndex].scheduledTime || '09:00';
        const scheduledDateTime = dayjs(`${date} ${scheduledTime}`);
        const timeDiff = scheduledDateTime.diff(now, 'hour', true);
        
        console.log('🕐 Time check:', {
          scheduledTime,
          scheduledDateTime: scheduledDateTime.format('YYYY-MM-DD HH:mm'),
          now: now.format('YYYY-MM-DD HH:mm'),
          timeDiff: timeDiff.toFixed(2) + ' hours'
        });
        
        if (timeDiff < 1) {
          return res.status(403).json({
            success: false,
            message: 'Қабул вақтига камida 1 соат қолганда таҳрирлаб бўлмайди'
          });
        }
      }
    }

    // Employee ni topish - employeeId bo'yicha yoki employeeId field bo'yicha
    console.log('🔍 Status update - Searching for employee:', employeeId);
    console.log('📋 Status update - Available employees:', reception.employees.map(e => ({
      id: e._id,
      employeeId: e.employeeId,
      name: e.name
    })));
    
    console.log('🔍 Status update - Comparing:', { 
      empId: reception.employees[employeeIndex].employeeId?.toString(), 
      searchId: employeeId.toString(), 
      match: reception.employees[employeeIndex].employeeId?.toString() === employeeId.toString() 
    });

    console.log('📍 Status update - Employee index found:', employeeIndex);

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

      // IMPORTANT: Add task to employee's personal taskHistory as well
      try {
        const actualEmployeeId = reception.employees[employeeIndex].employeeId;
        const employee = await Employee.findById(actualEmployeeId);
        
        if (employee) {
          // Create proper task data for employee's history
          const taskData = {
            description: task.description,
            deadline: new Date(Date.now() + (parseInt(task.deadline) * 24 * 60 * 60 * 1000)), // Convert days to date
            assignedBy: req.user ? req.user.fullName : 'Admin',
            priority: task.priority || 'normal',
            status: 'pending'
          };

          // Add to employee's task history
          await employee.addTask(taskData);
          console.log(`Task added to employee ${employee.name}'s personal task history`);

          // Send Telegram notification
          const getNotificationService = () => global.telegramNotificationService || null;
          const notificationService = getNotificationService();
          if (notificationService) {
            try {
              await notificationService.sendTaskNotification(actualEmployeeId, taskData, taskData.assignedBy);
              console.log(`Task notification sent to employee ${employee.name}`);
            } catch (notificationError) {
              console.error('Failed to send task notification:', notificationError);
            }
          }
        }
      } catch (taskError) {
        console.error('Failed to add task to employee history:', taskError);
        console.error('Task data that failed:', task);
        // Don't fail the main operation
      }
    }

    await reception.save();

    // Send Telegram notification for status update
    const getNotificationService = () => global.telegramNotificationService || null;
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          await notificationService.sendReceptionStatusUpdateNotification(employeeId, {
            date: date,
            time: reception.employees[employeeIndex].scheduledTime || 'Belgilanmagan',
            status: status,
            notes: null
          });
          console.log(`📲 Reception status update notification sent to employee ${employee.name}`);
        }
      } catch (notificationError) {
        console.error('Failed to send reception status notification:', notificationError);
      }
    }

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
 * Update reception employee (time, name, etc.)
 */
exports.updateReceptionEmployee = async (req, res) => {
  try {
    const { date, employeeId } = req.params;
    const updateData = req.body;

    console.log('🔄 Update reception employee request:', { date, employeeId, updateData });
    console.log('📋 Available fields in updateData:', Object.keys(updateData));

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

    // Employee ni topish
    console.log('🔍 Searching for employee:', employeeId);
    console.log('📋 Available employees in reception:', reception.employees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId,
      name: emp.name
    })));
    
    const employeeIndex = reception.employees.findIndex(
      emp => {
        // employeeId ObjectId yoki string bo'lishi mumkin
        const empId = emp.employeeId ? emp.employeeId.toString() : emp._id.toString();
        const searchId = employeeId.toString();
        console.log('🔍 Comparing:', { empId, searchId, match: empId === searchId });
        return empId === searchId;
      }
    );

    console.log('📍 Employee index found:', employeeIndex);

    if (employeeIndex === -1) {
      console.log('❌ Employee not found in reception');
      return res.status(404).json({
        success: false,
        message: 'Ходим бу сана учун қабулда топилмади'
      });
    }

    // Update employee data
    if (updateData.scheduledTime) {
      reception.employees[employeeIndex].scheduledTime = updateData.scheduledTime; // Asosiy qabul vaqti
    }
    if (updateData.time) {
      reception.employees[employeeIndex].time = updateData.time; // Legacy field
    }
    if (updateData.name) {
      reception.employees[employeeIndex].name = updateData.name;
    }
    if (updateData.position) {
      reception.employees[employeeIndex].position = updateData.position;
    }
    if (updateData.department) {
      reception.employees[employeeIndex].department = updateData.department;
    }
    if (updateData.phone) {
      reception.employees[employeeIndex].phone = updateData.phone;
    }

    reception.employees[employeeIndex].timeUpdated = new Date();

    await reception.save();

    res.json({
      success: true,
      message: 'Қабул маълумотлари муваффақиятли янгиланди',
      data: reception.employees[employeeIndex]
    });

  } catch (error) {
    console.error('Update reception employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Қабул маълумотларини янгилашда хатолик',
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
 * Update reception employee time
 */
exports.updateReceptionEmployee = async (req, res) => {
  try {
    const { date, employeeId } = req.params;
    const updateData = req.body;
    
    console.log('🔄 Update reception employee request:', {
      date,
      employeeId,
      updateData
    });
    
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

    // Vaqt cheklovlarini tekshirish
    const targetDate = dayjs(date);
    const now = dayjs();
    
    // O'tgan kunlarni tahrirlab bo'lmaydi
    if (targetDate.isBefore(now, 'day')) {
      return res.status(403).json({
        success: false,
        message: 'Ўтган кунларни таҳрирлаб бўлмайди'
      });
    }
    
    // Bugungi kun uchun - eng kamida 1 soat qolganda tahrirlash mumkin
    if (targetDate.isSame(now, 'day')) {
      const scheduledTime = dayjs(`${date} ${updateData.scheduledTime || '09:00'}`);
      const timeDiff = scheduledTime.diff(now, 'hour', true);
      
      if (timeDiff < 1) {
        return res.status(403).json({
          success: false,
          message: 'Қабул вақтига камida 1 соат қолганда таҳрирлаб бўлмайди'
        });
      }
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

    // Employee ni topish
    const employeeIndex = reception.employees.findIndex(
      emp => {
        const empId = emp.employeeId ? emp.employeeId.toString() : emp._id.toString();
        const searchId = employeeId.toString();
        return empId === searchId;
      }
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    // Eski vaqtni saqlash
    const oldScheduledTime = reception.employees[employeeIndex].scheduledTime;
    
    // Ma'lumotlarni yangilash - barcha field'larni saqlab qolish
    const originalEmployee = reception.employees[employeeIndex];
    reception.employees[employeeIndex] = {
      ...originalEmployee,
      ...updateData,
      // Asosiy field'larni aniq saqlab qolish
      employeeId: originalEmployee.employeeId,
      name: originalEmployee.name,
      position: originalEmployee.position,
      department: originalEmployee.department,
      phone: originalEmployee.phone,
      status: originalEmployee.status,
      task: originalEmployee.task,
      timeUpdated: new Date()
    };

    await reception.save();

    // Send Telegram notification for time update
    const getNotificationService = () => global.telegramNotificationService || null;
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          await notificationService.sendReceptionNotification(employeeId, {
            date: date,
            time: updateData.scheduledTime || 'Belgilanmagan',
            notes: `Qabul vaqti yangilandi: ${oldScheduledTime} → ${updateData.scheduledTime}`
          });
          console.log(`📲 Reception time update notification sent to employee ${employee.name}`);
        }
      } catch (notificationError) {
        console.error('Failed to send reception time notification:', notificationError);
      }
    }

    res.json({
      success: true,
      message: 'Ходим маълумотлари муваффақиятли янгиланди',
      data: reception.employees[employeeIndex]
    });

  } catch (error) {
    console.error('Update reception employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Ходим маълумотларини янгилашда хатолик',
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
