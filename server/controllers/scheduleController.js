const scheduleService = require("../services/scheduleService");
const { handleError } = require("../utils/helpers");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const Schedule = require('../models/Schedule');
const ReceptionHistory = require('../models/ReceptionHistory');
const Meeting = require('../models/Meeting');

// dayjs plugin'larni yoqish
dayjs.extend(utc);
dayjs.extend(timezone);

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

// Yangi jadval yaratish (eski API - faqat vazифалар)
const createSchedule = async (req, res) => {
  try {
    const { date, tasks } = req.body;
    
    console.log('Create schedule request:', { date, tasks });

    if (!date || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: "Сана ва вазифалар массиви талаб қилинади"
      });
    }

    // Date validation
    const targetDate = dayjs(date);
    if (!targetDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Нотўғри сана формати"
      });
    }

    console.log('Target date for schedule:', targetDate.format('YYYY-MM-DD'));

    // Mavjud schedule topish
    let schedule = await Schedule.findOne({
      date: {
        $gte: targetDate.startOf('day').toDate(),
        $lte: targetDate.endOf('day').toDate()
      }
    });

    if (schedule) {
      // Mavjud schedule yangilash
      schedule.tasks = [...schedule.tasks, ...tasks];
      schedule.updatedAt = new Date();
    } else {
      // Yangi schedule yaratish
      schedule = new Schedule({
        date: targetDate.toDate(),
        tasks: tasks,
        createdAt: new Date()
      });
    }

    await schedule.save();

    res.status(201).json({
      success: true,
      message: "Иш режа муваффақиятли яратилди",
      data: schedule
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: "Иш режани яратишда хатолик юз берди",
      error: error.message
    });
  }
};

// Jadval yangilash (eski API - faqat вазифалар)
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
    
    if (!targetDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Нотўғри сана формати'
      });
    }

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
      message: 'Кунлик режани олишда хатолик',
      error: error.message
    });
  }
};

/**
 * Save daily plan (YANGI API - birlashtirilgan saqlash)
 */
const saveDailyPlan = async (req, res) => {
  try {
    const { date, items } = req.body;
    
    console.log('Saving daily plan request:', { date, itemsCount: items?.length });
    console.log('Items to save:', items);
    
    if (!date || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Сана ва маълумотлар массиви талаб қилинади'
      });
    }

    // Date'ni to'g'ri formatga o'tkazish
    const targetDate = dayjs(date);
    
    // Date validation
    if (!targetDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Нотўғри сана формати'
      });
    }

    console.log('Target date:', targetDate.format('YYYY-MM-DD'));

    // Faqat yangi item'larni saqlash
    const newItems = items.filter(item => item.isNew !== false);
    
    console.log('New items to save:', newItems);
    
    if (newItems.length === 0) {
      return res.json({
        success: true,
        message: 'Сақлаш учун янги маълумотлар йўқ',
        data: { saved: 0 }
      });
    }

    const results = {
      tasks: 0,
      meetings: 0,
      receptions: 0,
      errors: []
    };

    // Ma'lumotlarni turga qarab ajratish va saqlash
    for (const item of newItems) {
      try {
        console.log(`Processing ${item.type}:`, JSON.stringify(item, null, 2));
        
        if (!item.type) {
          console.log('ERROR: Item type is missing!');
          results.errors.push(`Item type yo'q: ${JSON.stringify(item)}`);
          continue;
        }
        
        switch (item.type) {
          case 'meeting':
            console.log('=== SAVING MEETING ===');
            console.log('Meeting data received:', JSON.stringify(item, null, 2));
            console.log('Meeting name:', item.name || item.title);
            console.log('Meeting time:', item.time);
            console.log('Meeting location:', item.location);
            
            if (!item.name && !item.title) {
              console.log('ERROR: Meeting name missing');
              results.errors.push('Meeting nomi kiritilmagan');
              break;
            }
            
            // Meeting'ni Meeting modeliga saqlash
            const meeting = new Meeting({
              name: item.title || item.name,
              description: item.description || '',
              date: targetDate.toDate(),
              time: item.time,
              location: item.location || '',
              participants: item.participants || [],
              createdAt: new Date()
            });
            
            const savedMeeting = await meeting.save();
            console.log('Meeting saved with ID:', savedMeeting._id);
            results.meetings++;
            break;
            
          case 'task':
            console.log('=== SAVING TASK ===');
            console.log('Task data:', JSON.stringify(item, null, 2));

            if (!item.title) {
              results.errors.push('Вазифа номи киритилмаган');
              break;
            }

            let schedule = await Schedule.findOne({
              date: {
                $gte: targetDate.startOf('day').toDate(),
                $lte: targetDate.endOf('day').toDate()
              }
            });

            if (!schedule) {
              schedule = new Schedule({
                date: targetDate.toDate(),
                tasks: [],
                notes: ''
              });
            }

            schedule.tasks.push({
              title: item.title,
              description: item.description || '',
              startTime: item.time || '09:00',
              endTime: item.endTime || '10:00',
              priority: item.priority || 'normal',
              status: item.status || 'pending'
            });

            await schedule.save();
            results.tasks++;
            break;
            
          case 'reception':
            console.log('=== SAVING RECEPTION ===');
            // Reception'ni ReceptionHistory modeliga saqlash
            let receptionHistory = await ReceptionHistory.findOne({
              date: {
                $gte: targetDate.startOf('day').toDate(),
                $lte: targetDate.endOf('day').toDate()
              }
            });

            if (!receptionHistory) {
              receptionHistory = new ReceptionHistory({
                date: targetDate.toDate(),
                employees: []
              });
            }

            // Employee qo'shish (duplicate check)
            const existingEmployee = receptionHistory.employees.find(
              emp => emp.employeeId === item.employeeId
            );

            if (!existingEmployee) {
              receptionHistory.employees.push({
                employeeId: item.employeeId,
                name: item.name,
                position: item.position || '',
                department: item.department || '',
                phone: item.phone || '',
                status: item.status || 'waiting',
                timeUpdated: new Date(),
                createdAt: new Date()
              });
              await receptionHistory.save();
            }
            
            results.receptions++;
            console.log('Reception saved successfully');
            break;
            
          default:
            console.log(`Noma'lum tur: ${item.type}`);
            results.errors.push(`Noma'lum tur: ${item.type}`);
            break;
        }
      } catch (itemError) {
        console.error(`Error saving ${item.type}:`, itemError);
        results.errors.push(`${item.type} saqlashda xatolik: ${itemError.message}`);
      }
    }

    console.log('=== FINAL SAVE RESULTS ===');
    console.log('Tasks saved:', results.tasks);
    console.log('Meetings saved:', results.meetings);
    console.log('Receptions saved:', results.receptions);
    console.log('Errors:', results.errors);

    res.json({
      success: true,
      message: 'Кунлик режа муваффақиятли сақланди',
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

module.exports = {
  checkFutureDate,
  getScheduleByDate,
  createSchedule,
  updateSchedule,
  getDailyPlan,
  saveDailyPlan
};
