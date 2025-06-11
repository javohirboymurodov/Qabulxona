const ReceptionHistory = require('../models/ReceptionHistory');
const dayjs = require('dayjs');

async function archiveDailyReception() {
  try {
    const yesterday = dayjs().subtract(1, 'day').toDate();
    await ReceptionHistory.archiveDay(yesterday);
    
    // Yangi kunning qabulini yaratish
    const today = dayjs().startOf('day').toDate();
    
    // Kechagi qabulni olish
    const yesterdayReception = await ReceptionHistory.findOne({ 
      date: {
        $gte: dayjs(yesterday).startOf('day').toDate(),
        $lte: dayjs(yesterday).endOf('day').toDate()
      }
    });

    if (yesterdayReception) {
      // Bugungi qabul uchun yangi yozuv yaratish
      await ReceptionHistory.create({
        date: today,
        employees: yesterdayReception.employees.map(emp => ({
          ...emp.toObject(),
          status: 'absent',
          timeUpdated: new Date()
        })),
        totalPresent: 0,
        totalAbsent: yesterdayReception.employees.length
      });
    }
  } catch (error) {
    console.error('Qabulni arxivlashda xatolik:', error);
  }
}

module.exports = { archiveDailyReception };