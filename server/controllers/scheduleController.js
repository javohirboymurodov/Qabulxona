const scheduleService = require("../services/scheduleService");
const { handleError } = require("../utils/helpers");

// Get all schedules
exports.getSchedule = async (req, res, next) => {
  try {
    const schedules = await scheduleService.getAllSchedules();
    res.json(schedules);
  } catch (error) {
    next(error);
  }
};

// Kunlik jadval olish
exports.getScheduleByDate = async (req, res, next) => {
  try {
    const schedule = await scheduleService.getScheduleByDate(req.params.date);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

// Yangi jadval yaratish yoki yangilash
exports.createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createOrUpdateSchedule(
      req.params.date,
      req.body
    );
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
};

// Add task to schedule
exports.addTask = async (req, res, next) => {
  try {
    const schedule = await scheduleService.addTask(req.params.date, req.body);
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { date } = req.params;
    const schedule = await scheduleService.createOrUpdateSchedule(
      date,
      req.body
    );
    res.json(schedule);
  } catch (error) {
    console.error("Schedule update error:", error);
    res.status(500).json({
      message: error.message || "Jadval yangilashda xatolik yuz berdi",
    });
  }
};
// Update task
exports.updateTask = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateTask(
      req.params.date,
      req.params.taskId,
      req.body
    );
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const result = await scheduleService.deleteTask(
      req.params.date,
      req.params.taskId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get schedules by date range
exports.getSchedulesByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.params;
    const schedules = await scheduleService.getSchedulesByDateRange(
      startDate,
      endDate
    );
    res.json(schedules);
  } catch (error) {
    next(error);
  }
};
