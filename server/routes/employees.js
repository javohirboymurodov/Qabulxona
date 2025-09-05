const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { upload } = require('../middleware/fileUpload');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Xodimlar boshqaruvi
 */

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Barcha xodimlarni olish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xodimlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', employeeController.getAllEmployees);

/**
 * @swagger
 * /api/employees/search/{query}:
 *   get:
 *     summary: Xodimlarni qidirish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Qidiruv so'zi
 *     responses:
 *       200:
 *         description: Qidiruv natijalari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search/:query', employeeController.searchEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Bitta xodimni olish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Xodim ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Xodim topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', employeeController.getEmployeeById);

/**
 * @swagger
 * /api/employees/{id}/obektivka:
 *   get:
 *     summary: Xodim obektivkasini olish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Obektivka fayli
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Obektivka topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/obektivka', employeeController.getEmployeePDF);

/**
 * @swagger
 * /api/employees/{id}/tasks:
 *   post:
 *     summary: Xodimga topshiriq berish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - deadline
 *             properties:
 *               description:
 *                 type: string
 *                 description: Topshiriq tavsifi
 *               deadline:
 *                 type: number
 *                 description: Muddat (kun)
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 description: Prioritet
 *     responses:
 *       200:
 *         description: Topshiriq muvaffaqiyatli berildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Xodim topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/tasks', employeeController.assignTask);

/**
 * @swagger
 * /api/employees/{id}/tasks:
 *   get:
 *     summary: Xodim topshiriqlar tarixini olish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Topshiriqlar tarixi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       description:
 *                         type: string
 *                       deadline:
 *                         type: number
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       assignedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Xodim topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/tasks', employeeController.getTaskHistory);

/**
 * @swagger
 * /api/employees/{id}/tasks/{taskId}:
 *   put:
 *     summary: Topshiriq holatini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Topshiriq ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, overdue]
 *                 description: Yangi holat
 *     responses:
 *       200:
 *         description: Topshiriq holati yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Xodim yoki topshiriq topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/tasks/:taskId', employeeController.updateTaskStatus);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Yangi xodim qo'shish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - position
 *               - phone
 *               - department
 *               - experience
 *             properties:
 *               name:
 *                 type: string
 *                 description: Xodim ismi
 *               position:
 *                 type: string
 *                 description: Lavozimi
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *               department:
 *                 type: string
 *                 description: Bo'lim
 *               experience:
 *                 type: number
 *                 description: Ish tajribasi (yil)
 *               biography:
 *                 type: string
 *                 description: Qo'shimcha ma'lumot
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Tug'ilgan sana
 *               education:
 *                 type: string
 *                 description: Ma'lumoti
 *               obektivka:
 *                 type: string
 *                 format: binary
 *                 description: Obektivka fayli
 *     responses:
 *       201:
 *         description: Xodim muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('obektivka'), employeeController.createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Xodim ma'lumotlarini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Xodim ismi
 *               position:
 *                 type: string
 *                 description: Lavozimi
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *               department:
 *                 type: string
 *                 description: Bo'lim
 *               experience:
 *                 type: number
 *                 description: Ish tajribasi (yil)
 *               biography:
 *                 type: string
 *                 description: Qo'shimcha ma'lumot
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Tug'ilgan sana
 *               education:
 *                 type: string
 *                 description: Ma'lumoti
 *               obektivka:
 *                 type: string
 *                 format: binary
 *                 description: Obektivka fayli
 *     responses:
 *       200:
 *         description: Xodim ma'lumotlari yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Xodim topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', upload.single('obektivka'), employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Xodimni o'chirish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Xodim muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Xodim topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', employeeController.deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/status:
 *   put:
 *     summary: Xodim holatini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waiting, present, absent]
 *                 description: Yangi holat
 *     responses:
 *       200:
 *         description: Xodim holati yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Xodim topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token haqiqiy emas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/status', employeeController.updateEmployeeStatus);

module.exports = router;