const employeeService = require('../services/employeeService');
const path = require('path');

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
    const employee = await employeeService.createEmployee(req.body, req.file);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
};

// Update employee
exports.updateEmployee = async (req, res, next) => {
  try {
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
