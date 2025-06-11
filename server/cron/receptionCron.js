const cron = require('node-cron');
const { archiveDailyReception } = require('../services/archiveService');

// Har kuni yarim tunda
cron.schedule('0 0 * * *', async () => {
  console.log('Kunlik qabulni arxivlash boshlandi');
  await archiveDailyReception();
});