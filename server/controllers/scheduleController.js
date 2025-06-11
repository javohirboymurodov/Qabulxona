const scheduleService = require("../services/scheduleService");
const { handleError } = require("../utils/helpers");
const Schedule = require('../models/Schedule');
const dayjs = require('dayjs');

// O'tgan kunlar uchun cheklov
const checkFutureDate = (req, res, next) => {
  const scheduleDate = dayjs(req.params.date || req.body.date).startOf('day');
  const today = dayjs().startOf('day');

  if (scheduleDate.isBefore(today)) {
    return res.status(403).json({
      success: false,
      message: "Ўтган сана учун иш режа киритиб бўлмайди"
    });
  }
  next();
};

// Kunlik jadval olish
const getScheduleByDate = async (req, res) => {
  try {
    const startDate = dayjs(req.params.date).startOf('day').toDate();
    const endDate = dayjs(req.params.date).endOf('day').toDate();

    const schedule = await Schedule.findOne({ 
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Schedule fetch error:', error);
    res.status(500).json({
      success: false,
      message: "Жадвални юклашда хатолик юз берди"
    });
  }
};

// Yangi jadval yaratish
const createSchedule = async (req, res) => {
  try {
    const newSchedule = new Schedule({
      date: new Date(req.params.date),
      tasks: req.body.tasks
    });
    
    await newSchedule.save();
    res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Иш режани сақлашда хатолик юз берди"
    });
  }
};

// Jadval yangilash
const updateSchedule = async (req, res) => {
  try {
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { date: new Date(req.params.date) },
      { tasks: req.body.tasks },
      { new: true }
    );
    
    res.json({ success: true, data: updatedSchedule });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Иш режани янгилашда хатолик юз берди"
    });
  }
};

module.exports = {
  checkFutureDate,
  getScheduleByDate,
  createSchedule,
  updateSchedule
};
