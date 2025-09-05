const cron = require('node-cron');
const ReceptionHistory = require('../models/ReceptionHistory');
const dayjs = require('dayjs');

// Har kuni yarim tunda ishga tushadi - faqat log qo'shish
cron.schedule('0 0 * * *', async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    console.log(`Daily scheduler running for ${today}`);
    
    // Hozircha faqat log qo'shamiz, katta operatsiyalar qo'shmaslik
    console.log('Daily scheduler completed successfully');
  } catch (error) {
    console.error('Error in daily scheduler:', error);
  }
});