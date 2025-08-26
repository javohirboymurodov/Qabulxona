const employeeService = require('../services/employeeService');
const path = require('path');
const Employee = require('../models/Employee');
const dayjs = require('dayjs');

// Telegram notification service
const getNotificationService = () => global.telegramNotificationService || null;

// Get all employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

// Search employees
exports.searchEmployees = async (req, res, next) => {
  try {
    const employees = await employeeService.searchEmployees(req.params.query);
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Ходим топилмади' });
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
};

// Create new employee
exports.createEmployee = async (req, res, next) => {
  try {
    // console.log('Yangi xodim uchun yuklangan fayl:', req.file);
    const employee = await employeeService.createEmployee(req.body, req.file);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
};

// Update employee
exports.updateEmployee = async (req, res, next) => {
  try {
    // console.log('Xodim yangilash uchun yuklangan fayl:', req.file);
    const employee = await employeeService.updateEmployee(req.params.id, req.body, req.file);
    res.json(employee);
  } catch (error) {
    next(error);
  }
};

// Delete employee
exports.deleteEmployee = async (req, res, next) => {
  try {
    const result = await employeeService.deleteEmployee(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Update employee status
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { receptionDate, status } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { 
        receptionDate,
        status
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    res.json({
      success: true,
      data: updatedEmployee
    });

  } catch (error) {
    console.error('Update employee status error:', error);
    res.status(500).json({
      success: false,
      message: 'Ходим ҳолатини янгилашда хатолик юз берди'
    });
  }
};

// Assign task to employee
exports.assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, deadline, priority = 'normal' } = req.body;
    const assignedBy = req.admin ? req.admin.fullName : 'Admin';

    // Validation
    if (!description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Topshiriq tavsifi va muddati talab qilinadi'
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    // Create task data
    const taskData = {
      description,
      deadline: new Date(deadline),
      assignedBy,
      priority,
      status: 'pending'
    };

    // Add task to employee's history
    await employee.addTask(taskData);

    // Send Telegram notification
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.sendTaskNotification(id, taskData, assignedBy);
        console.log(`Task notification sent to employee ${employee.name}`);
      } catch (notificationError) {
        console.error('Failed to send task notification:', notificationError);
        // Don't fail the main operation if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Topshiriq muvaffaqiyatli tayinlandi',
      data: {
        task: taskData,
        employee: {
          id: employee._id,
          name: employee.name,
          position: employee.position
        }
      }
    });

  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiriq tayinlashda xatolik yuz berdi'
    });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri status qiymati'
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    const completedAt = status === 'completed' ? new Date() : null;
    const result = await employee.updateTaskStatus(taskId, status, completedAt);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Topshiriq topilmadi'
      });
    }

    res.json({
      success: true,
      message: 'Topshiriq holati yangilandi',
      data: result
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiriq holatini yangilashda xatolik'
    });
  }
};

// Get employee's task history
exports.getTaskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50 } = req.query;

    const employee = await Employee.findById(id).select('name position taskHistory');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Ходим топилмади'
      });
    }

    let tasks = employee.taskHistory;

    // Filter by status if provided
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    // Sort by creation date (newest first) and limit
    tasks = tasks
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
      .slice(0, parseInt(limit));

    const summary = {
      total: employee.taskHistory.length,
      pending: employee.taskHistory.filter(t => t.status === 'pending').length,
      completed: employee.taskHistory.filter(t => t.status === 'completed').length,
      overdue: employee.taskHistory.filter(t => t.status === 'overdue').length
    };

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          position: employee.position
        },
        tasks,
        summary
      }
    });

  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({
      success: false,
      message: 'Topshiriqlar tarixini olishda xatolik'
    });
  }
};

// Get employee PDF
exports.getEmployeePDF = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee.objectivePath) {
      throw new Error('ПДФ файл топилмади');
    }
    
    const filePath = path.join(__dirname, '..', 'uploadObektivka', employee.objectivePath);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};
