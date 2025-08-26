const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { upload } = require('../middleware/fileUpload');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Get all employees
router.get('/', employeeController.getAllEmployees);

// Search employees
router.get('/search/:query', employeeController.searchEmployees);

// Get single employee
router.get('/:id', employeeController.getEmployeeById);

// Get employee PDF
router.get('/:id/obektivka', employeeController.getEmployeePDF);

// Task management routes
router.post('/:id/tasks', employeeController.assignTask);
router.get('/:id/tasks', employeeController.getTaskHistory);
router.put('/:id/tasks/:taskId', employeeController.updateTaskStatus);

// Create new employee with file upload
router.post('/', upload.single('obektivka'), employeeController.createEmployee);

// Update employee with file upload
router.put('/:id', upload.single('obektivka'), employeeController.updateEmployee);

// Delete employee
router.delete('/:id', employeeController.deleteEmployee);

// Update employee status
router.put('/:id/status', employeeController.updateEmployeeStatus);

module.exports = router;