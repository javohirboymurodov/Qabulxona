const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

/**
 * @swagger
 * tags:
 *   name: Meetings
 *   description: Yig'ilishlar boshqaruvi
 */

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: Barcha yig'ilishlarni olish
 *     tags: [Meetings]
 *     responses:
 *       200:
 *         description: Yig'ilishlar ro'yxati
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
 *                     $ref: '#/components/schemas/Meeting'
 */
router.get('/', meetingController.getAllMeetings);

/**
 * @swagger
 * /api/meetings/range/{startDate}/{endDate}:
 *   get:
 *     summary: Sana oralig'ida yig'ilishlarni olish
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Boshlanish sanasi
 *       - in: path
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tugash sanasi
 *     responses:
 *       200:
 *         description: Sana oralig'idagi yig'ilishlar
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
 *                     $ref: '#/components/schemas/Meeting'
 */
router.get('/range/:startDate/:endDate', meetingController.getMeetingsByDateRange);

/**
 * @swagger
 * /api/meetings/participant/{employeeId}:
 *   get:
 *     summary: Xodim qatnashgan yig'ilishlarni olish
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Xodim qatnashgan yig'ilishlar
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
 *                     $ref: '#/components/schemas/Meeting'
 */
router.get('/participant/:employeeId', meetingController.getMeetingsByParticipant);

/**
 * @swagger
 * /api/meetings/{id}:
 *   get:
 *     summary: Bitta yig'ilishni olish
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yig'ilish ID
 *     responses:
 *       200:
 *         description: Yig'ilish ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Meeting'
 *       404:
 *         description: Yig'ilish topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', meetingController.getMeetingById);

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Yangi yig'ilish yaratish
 *     tags: [Meetings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *               - time
 *               - participants
 *             properties:
 *               name:
 *                 type: string
 *                 description: Yig'ilish nomi
 *               description:
 *                 type: string
 *                 description: Yig'ilish tavsifi
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Yig'ilish sanasi
 *               time:
 *                 type: string
 *                 description: Yig'ilish vaqti (HH:mm)
 *               location:
 *                 type: string
 *                 description: Yig'ilish joyi
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Qatnashuvchilar ID lari
 *     responses:
 *       201:
 *         description: Yig'ilish muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Meeting'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', meetingController.createMeeting);

/**
 * @swagger
 * /api/meetings/{id}:
 *   put:
 *     summary: Yig'ilish ma'lumotlarini yangilash
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yig'ilish ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Yig'ilish nomi
 *               description:
 *                 type: string
 *                 description: Yig'ilish tavsifi
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Yig'ilish sanasi
 *               time:
 *                 type: string
 *                 description: Yig'ilish vaqti (HH:mm)
 *               location:
 *                 type: string
 *                 description: Yig'ilish joyi
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Qatnashuvchilar ID lari
 *     responses:
 *       200:
 *         description: Yig'ilish ma'lumotlari yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Meeting'
 *       404:
 *         description: Yig'ilish topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', meetingController.updateMeeting);

/**
 * @swagger
 * /api/meetings/{id}:
 *   delete:
 *     summary: Yig'ilishni o'chirish
 *     tags: [Meetings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yig'ilish ID
 *     responses:
 *       200:
 *         description: Yig'ilish muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Yig'ilish topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', meetingController.deleteMeeting);

module.exports = router;
