const cron = require('node-cron');
const Employee = require('../models/Employee');
const ReceptionHistory = require('../models/ReceptionHistory');
const dayjs = require('dayjs');

// Har kuni yarim tunda ishga tushadi
cron.schedule('0 0 * * *', async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    
    // Bugungi qabullarni olish
    const todayReceptions = await Employee.find({
      receptionDate: {
        $gte: dayjs(today).startOf('day'),
        $lte: dayjs(today).endOf('day')
      }
    });

    // Qabul tarixiga saqlash
    if (todayReceptions.length > 0) {
      await ReceptionHistory.create({
        date: today,
        employees: todayReceptions.map(emp => ({
          employeeId: emp._id,
          name: emp.fullName,
          position: emp.position,
          department: emp.department,
          status: emp.status || 'waiting',
          task: emp.task,
          timeUpdated: new Date()
        }))
      });
    }

    console.log('Reception history saved successfully');
  } catch (error) {
    console.error('Error saving reception history:', error);
  }
});