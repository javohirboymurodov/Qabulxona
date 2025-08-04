const scheduleService = require("../services/scheduleService");
const { handleError } = require("../utils/helpers");
const Schedule = require('../models/Schedule');
const Meeting = require('../models/Meeting');
const ReceptionHistory = require('../models/ReceptionHistory');
const Employee = require('../models/Employee');
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

// Kunlik jadval olish (eski API - faqat vazifalar)
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

// Yangi jadval yaratish (eski API - faqat vazifalar)
const createSchedule = async (req, res) => {
  try {
    const targetDate = dayjs(req.params.date);
    
    // Mavjud schedule borligini tekshirish
    let schedule = await Schedule.findOne({
      date: {
        $gte: targetDate.startOf('day').toDate(),
        $lte: targetDate.endOf('day').toDate()
      }
    });

    if (schedule) {
      // Mavjud bo'lsa yangilash
      schedule.tasks = req.body.tasks;
      await schedule.save();
    } else {
      // Yangi yaratish
      schedule = new Schedule({
        date: targetDate.toDate(),
        tasks: req.body.tasks
      });
      await schedule.save();
    }
    
    res.status(201).json({ 
      success: true, 
      data: schedule,
      message: "Иш режа муваффақиятли сақланди"
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: "Иш режани сақлашда хатолик юз берди"
    });
  }
};

// Jadval yangilash (eski API - faqat vazifalar)
const updateSchedule = async (req, res) => {
  try {
    const targetDate = dayjs(req.params.date);
    
    const updatedSchedule = await Schedule.findOneAndUpdate(
      { 
        date: {
          $gte: targetDate.startOf('day').toDate(),
          $lte: targetDate.endOf('day').toDate()
        }
      },
      { tasks: req.body.tasks },
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true, 
      data: updatedSchedule,
      message: "Иш режа муваффақиятли янгиланди"
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: "Иш режани янгилашда хатолик юз берди"
    });
  }
};

/**
 * Get daily plan (YANGI API - birlashtirilgan ma'lumotlar)
 */
const getDailyPlan = async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = dayjs(date);
    
    console.log(`Fetching daily plan for: ${targetDate.format('YYYY-MM-DD')}`);
    
    // Parallel ravishda barcha ma'lumotlarni olish
    const [schedule, meetings, reception] = await Promise.all([
      // Kunlik vazifalar
      Schedule.findOne({
        date: {
          $gte: targetDate.startOf('day').toDate(),
          $lte: targetDate.endOf('day').toDate()
        }
      }),
      
      // Majlislar
      Meeting.find({
        date: {
          $gte: targetDate.startOf('day').toDate(),
          $lte: targetDate.endOf('day').toDate()
        }
      }).populate('participants', 'name position department'),
      
      // Qabullar
      ReceptionHistory.findOne({
        date: {
          $gte: targetDate.startOf('day').toDate(),
          $lte: targetDate.endOf('day').toDate()
        }
      }).populate('employees.employeeId', 'name position department')
    ]);

    // Barcha ma'lumotlarni birlashtirish
    const allItems = [];
    
    // Vazifalarni qo'shish
    if (schedule?.tasks && schedule.tasks.length > 0) {
      schedule.tasks.forEach(task => {
        allItems.push({
          id: task._id.toString(),
          type: 'task',
          time: task.startTime,
          endTime: task.endTime,
          title: task.title,
          description: task.description,
          priority: task.priority || 'normal',
          status: task.status || 'pending',
          createdAt: task.createdAt,
          data: task
        });
      });
    }
    
    // Majlislarni qo'shish
    if (meetings && meetings.length > 0) {
      meetings.forEach(meeting => {
        allItems.push({
          id: meeting._id.toString(),
          type: 'meeting',
          time: meeting.time,
          title: meeting.name,
          description: meeting.description,
          location: meeting.location,
          participants: meeting.participants,
          createdAt: meeting.createdAt,
          data: meeting
        });
      });
    }
    
    // Qabullarni qo'shish
    if (reception?.employees && reception.employees.length > 0) {
      reception.employees.forEach(emp => {
        allItems.push({
          id: emp._id.toString(),
          type: 'reception',
          time: emp.timeUpdated ? dayjs(emp.timeUpdated).format('HH:mm') : '09:00',
          title: emp.name,
          description: emp.task?.description || emp.purpose || 'Рахбар қабули',
          department: emp.department,
          position: emp.position,
          status: emp.status,
          phone: emp.phone,
          createdAt: emp.createdAt,
          data: emp
        });
      });
    }
    
    // Vaqt bo'yicha saralash
    allItems.sort((a, b) => {
      const timeA = (a.time || '00:00').replace(':', '');
      const timeB = (b.time || '00:00').replace(':', '');
      return timeA - timeB;
    });

    res.json({
      success: true,
      data: {
        date: targetDate.format('YYYY-MM-DD'),
        items: allItems,
        summary: {
          totalTasks: schedule?.tasks?.length || 0,
          totalMeetings: meetings.length,
          totalReceptions: reception?.employees?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Daily plan fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Kunlik rejani olishda xatolik'
    });
  }
};

/**
 * Save daily plan (YANGI API - birlashtirilgan saqlash)
 */
const saveDailyPlan = async (req, res) => {  // <-- const bilan e'lon qilish
  try {
    const { date, items } = req.body;
    
    if (!date || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Сана ва маълумотлар массиви талаб қилинади'
      });
    }

    const targetDate = dayjs(date);
    const results = {
      tasks: [],
      meetings: [],
      receptions: []
    };

    // Ma'lumotlarni turga qarab ajratish va saqlash
    for (const item of items) {
      try {
        switch (item.type) {
          case 'task':
            const taskResult = await saveTask(targetDate, item);
            results.tasks.push(taskResult);
            break;
            
          case 'meeting':
            const meetingResult = await saveMeeting(targetDate, item);
            results.meetings.push(meetingResult);
            break;
            
          case 'reception':
            const receptionResult = await saveReception(targetDate, item);
            results.receptions.push(receptionResult);
            break;
            
          default:
            console.warn('Noma\'lum tur:', item.type);
        }
      } catch (itemError) {
        console.error(`Error saving ${item.type}:`, itemError);
      }
    }

    res.json({
      success: true,
      message: 'Kunlik reja muvaffaqiyatli saqlandi',
      data: results
    });

  } catch (error) {
    console.error('Save daily plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Кунлик режани сақлашда хатолик',
      error: error.message
    });
  }
};

// Yordamchi funksiyalar
async function saveTask(date, taskData) {
  let schedule = await Schedule.findOne({
    date: {
      $gte: date.startOf('day').toDate(),
      $lte: date.endOf('day').toDate()
    }
  });
  
  if (!schedule) {
    schedule = new Schedule({
      date: date.toDate(),
      tasks: []
    });
  }
  
  // Yangi vazifa qo'shish yoki mavjudini yangilash
  if (taskData.id && taskData.id !== 'new') {
    const taskIndex = schedule.tasks.findIndex(task => task._id.toString() === taskData.id.toString());
    if (taskIndex !== -1) {
      schedule.tasks[taskIndex] = { ...schedule.tasks[taskIndex], ...taskData };
    } else {
      schedule.tasks.push(taskData);
    }
  } else {
    schedule.tasks.push(taskData);
  }
  
  return await schedule.save();
}

async function saveMeeting(date, meetingData) {
  const meeting = new Meeting({
    ...meetingData,
    date: date.toDate()
  });
  
  return await meeting.save();
}

async function saveReception(date, receptionData) {
  // receptionHistoryController dagi addToReception funksiyasidan foydalanish
  const receptionController = require('./receptionHistoryController');
  
  const mockReq = {
    body: {
      employeeId: receptionData.employeeId,
      name: receptionData.name,
      position: receptionData.position,
      department: receptionData.department,
      phone: receptionData.phone,
      status: receptionData.status || 'waiting',
      task: receptionData.task
    }
  };
  
  const mockRes = {
    status: () => mockRes,
    json: (data) => data
  };
  
  return await receptionController.addToReception(mockReq, mockRes);
}

module.exports = {
  checkFutureDate,
  getScheduleByDate,
  createSchedule,
  updateSchedule,
  getDailyPlan,
  saveDailyPlan    // <-- Bu qator bor bo'lishi kerak
};
