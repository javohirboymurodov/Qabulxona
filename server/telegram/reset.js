// telegram/reset.js - Bot tokenni tozalash uchun
require('dotenv').config();
const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found');
  process.exit(1);
}

// Function to make API request
function makeRequest(method, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function resetBot() {
  try {
    console.log('🔄 Telegram bot tokenni tozalash...');
    
    // 1. Delete webhook
    console.log('1. Webhook ni o\'chirish...');
    const deleteWebhook = await makeRequest('deleteWebhook', { drop_pending_updates: true });
    console.log('✅ Webhook o\'chirildi:', deleteWebhook.description || 'OK');
    
    // 2. Get bot info
    console.log('2. Bot ma\'lumotlarini olish...');
    const me = await makeRequest('getMe');
    if (me.ok) {
      console.log(`✅ Bot: @${me.result.username} (${me.result.first_name})`);
    }
    
    // 3. Get pending updates and drop them
    console.log('3. Kutilayotgan yangilanishlarni tozalash...');
    const updates = await makeRequest('getUpdates', { 
      timeout: 1,
      limit: 1
    });
    
    if (updates.ok && updates.result.length > 0) {
      console.log(`📄 ${updates.result.length} ta yangilanish topildi`);
      
      // Get last update_id to skip all pending updates
      const lastUpdateId = updates.result[updates.result.length - 1].update_id;
      await makeRequest('getUpdates', { 
        offset: lastUpdateId + 1,
        timeout: 1
      });
      console.log('✅ Barcha kutilayotgan yangilanishlar o\'tkazib yuborildi');
    } else {
      console.log('✅ Kutilayotgan yangilanishlar yo\'q');
    }
    
    console.log('');
    console.log('🎉 Bot muvaffaqiyatli tozalandi!');
    console.log('💡 Endi bot yangi instanceni ishga tushirish mumkin');
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    if (error.message.includes('409')) {
      console.log('💡 409 xatolik hali ham bor. Bir necha daqiqa kutib qaytadan urinib ko\'ring');
    }
  }
}

// Run reset
resetBot();