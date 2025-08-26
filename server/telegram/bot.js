require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('../config/db');
const Employee = require('../models/Employee');
const NotificationService = require('./services/notificationService');

// Bot configuration
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

// Initialize notification service
const notificationService = new NotificationService(bot);

// Connect to database
connectDB();

// Initialize reminder schedulers
const { initializeSchedulers } = require('./scheduler/reminderScheduler');
initializeSchedulers();

console.log('🤖 Telegram bot ishga tushdi!');

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  console.log(`New user started bot: ${user.first_name} ${user.last_name} (@${user.username})`);
  
  try {
    // Check if user is already registered
    const existingEmployee = await Employee.findOne({ telegramId: chatId.toString() });
    
    if (existingEmployee) {
      bot.sendMessage(chatId, `
🎉 Xush kelibsiz, ${existingEmployee.name}!

Siz allaqachon ro'yxatdan o'tgansiz.

📱 Quyidagi buyruqlardan foydalanishingiz mumkin:
/profile - Shaxsiy ma'lumotlar
/tasks - Joriy topshiriqlar  
/history - Topshiriqlar tarixi
/help - Yordam
      `);
      return;
    }
    
    // Request phone number
    bot.sendMessage(chatId, `
👋 Assalomu alaykum, ${user.first_name}!

Qabulxona botiga xush kelibsiz! 

📝 Ro'yxatdan o'tish uchun telefon raqamingizni yuborishingiz kerak.

⚠️ Telefon raqamingiz tizimda ro'yxatga olingan bo'lishi shart!
    `, {
      reply_markup: {
        keyboard: [
          [{
            text: '📱 Telefon raqamni yuborish',
            request_contact: true
          }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    
  } catch (error) {
    console.error('Start command error:', error);
    bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
  }
});

// Handle contact sharing
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  
  console.log(`Contact received: ${contact.phone_number} from ${contact.first_name}`);
  
  try {
    // Check if the contact is the user themselves
    if (contact.user_id !== msg.from.id) {
      bot.sendMessage(chatId, '❌ Iltimos, o\'z telefon raqamingizni yuboring!');
      return;
    }
    
    // Find employee by phone number
    const employee = await Employee.findByTelegramPhone(contact.phone_number);
    
    if (!employee) {
      bot.sendMessage(chatId, `
❌ Afsuski, sizning telefon raqamingiz (${contact.phone_number}) tizimda topilmadi.

🔍 Iltimos, quyidagilarni tekshiring:
• Telefon raqamingiz to'g'ri kiritilganmi
• Tizimda ro'yxatdan o'tganmisiz

📞 Agar muammo davom etsa, administrator bilan bog'laning.
      `, {
        reply_markup: {
          remove_keyboard: true
        }
      });
      return;
    }
    
    // Check if employee already has telegram account linked
    if (employee.telegramId && employee.telegramId !== chatId.toString()) {
      bot.sendMessage(chatId, `
⚠️ Bu telefon raqam boshqa Telegram akkaunt bilan bog'langan.

Agar bu sizning raqamingiz bo'lsa, administrator bilan bog'laning.
      `, {
        reply_markup: {
          remove_keyboard: true
        }
      });
      return;
    }
    
    // Link telegram account to employee
    employee.telegramId = chatId.toString();
    employee.telegramPhone = contact.phone_number;
    employee.isVerified = true;
    await employee.save();
    
    bot.sendMessage(chatId, `
✅ Muvaffaqiyatli ro'yxatdan o'tdingiz!

👤 **${employee.name}**
🏢 ${employee.position}
🏛️ ${employee.department}

📱 Endi sizga quyidagi xabarlar yuboriladi:
• Qabulga yozilganingizda
• Majlisga taklif qilinganingizda  
• Yangi topshiriq berilganida
• Topshiriq muddati tugashidan oldin

📋 Buyruqlar:
/profile - Shaxsiy ma'lumotlar
/tasks - Joriy topshiriqlar
/history - Topshiriqlar tarixi  
/settings - Xabar sozlamalari
/help - Yordam
    `, {
      reply_markup: {
        remove_keyboard: true
      },
      parse_mode: 'Markdown'
    });
    
    console.log(`Employee registered: ${employee.name} (${employee.phone}) -> Telegram ID: ${chatId}`);
    
  } catch (error) {
    console.error('Contact handler error:', error);
    bot.sendMessage(chatId, '❌ Ro\'yxatdan o\'tishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
  }
});

// Profile command
bot.onText(/\/profile/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const employee = await Employee.findOne({ telegramId: chatId.toString() });
    
    if (!employee) {
      bot.sendMessage(chatId, '❌ Siz ro\'yxatdan o\'tmagan ekan. /start buyrug\'ini bosing.');
      return;
    }
    
    const activeTasks = employee.taskHistory.filter(task => task.status === 'pending').length;
    const completedTasks = employee.taskHistory.filter(task => task.status === 'completed').length;
    
    bot.sendMessage(chatId, `
👤 **Shaxsiy ma'lumotlar**

📝 **Ism:** ${employee.name}
🏢 **Lavozim:** ${employee.position}  
🏛️ **Bo'lim:** ${employee.department}
📱 **Telefon:** ${employee.phone}
⏰ **Ish staji:** ${employee.experience} yil
${employee.education ? `🎓 **Ta'lim:** ${employee.education}` : ''}

📊 **Topshiriqlar statistikasi:**
• Faol topshiriqlar: ${activeTasks}
• Bajarilgan: ${completedTasks}
• Jami: ${employee.taskHistory.length}

📅 **Ro'yxatdan o'tgan:** ${employee.createdAt.toLocaleDateString('uz-UZ')}
    `, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Profile command error:', error);
    bot.sendMessage(chatId, '❌ Ma\'lumotlarni olishda xatolik yuz berdi.');
  }
});

// Tasks command
bot.onText(/\/tasks/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const employee = await Employee.findOne({ telegramId: chatId.toString() });
    
    if (!employee) {
      bot.sendMessage(chatId, '❌ Siz ro\'yxatdan o\'tmagan ekan. /start buyrug\'ini bosing.');
      return;
    }
    
    const activeTasks = employee.taskHistory.filter(task => task.status === 'pending');
    
    if (activeTasks.length === 0) {
      bot.sendMessage(chatId, '📋 Sizda hozircha faol topshiriqlar yo\'q.');
      return;
    }
    
    let message = `📋 **Faol topshiriqlar (${activeTasks.length}):**\n\n`;
    
    activeTasks.forEach((task, index) => {
      const deadline = new Date(task.deadline);
      const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
      const priorityEmoji = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟡' : '🟢';
      
      message += `${index + 1}. ${priorityEmoji} **${task.description}**\n`;
      message += `   📅 Muddat: ${deadline.toLocaleDateString('uz-UZ')}\n`;
      message += `   ⏰ Qolgan: ${daysLeft > 0 ? `${daysLeft} kun` : 'Muddati o\'tgan'}\n`;
      message += `   👤 Kim bergan: ${task.assignedBy}\n\n`;
    });
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('Tasks command error:', error);
    bot.sendMessage(chatId, '❌ Topshiriqlarni olishda xatolik yuz berdi.');
  }
});

// History command
bot.onText(/\/history/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const employee = await Employee.findOne({ telegramId: chatId.toString() });
    
    if (!employee) {
      bot.sendMessage(chatId, '❌ Siz ro\'yxatdan o\'tmagan ekan. /start buyrug\'ini bosing.');
      return;
    }
    
    if (employee.taskHistory.length === 0) {
      bot.sendMessage(chatId, '📋 Topshiriqlar tarixi bo\'sh.');
      return;
    }
    
    const recentTasks = employee.taskHistory
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
      .slice(0, 10); // So'nggi 10 ta topshiriq
    
    let message = `📚 **So'nggi topshiriqlar (${recentTasks.length}/${employee.taskHistory.length}):**\n\n`;
    
    recentTasks.forEach((task, index) => {
      const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'overdue' ? '❌' : '⏳';
      const assignedDate = new Date(task.assignedAt);
      
      message += `${index + 1}. ${statusEmoji} **${task.description}**\n`;
      message += `   📅 Berilgan: ${assignedDate.toLocaleDateString('uz-UZ')}\n`;
      message += `   📊 Holat: ${task.status === 'completed' ? 'Bajarilgan' : task.status === 'overdue' ? 'Muddati o\'tgan' : 'Jarayonda'}\n`;
      if (task.completedAt) {
        message += `   ✅ Bajarilgan: ${new Date(task.completedAt).toLocaleDateString('uz-UZ')}\n`;
      }
      message += '\n';
    });
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('History command error:', error);
    bot.sendMessage(chatId, '❌ Tarixni olishda xatolik yuz berdi.');
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `
🤖 **Qabulxona Bot - Yordam**

📋 **Mavjud buyruqlar:**

/start - Botni ishga tushirish va ro'yxatdan o'tish
/profile - Shaxsiy ma'lumotlaringizni ko'rish
/tasks - Joriy faol topshiriqlaringiz
/history - Topshiriqlar tarixi
/settings - Xabar sozlamalari
/help - Bu yordam xabari

📱 **Avtomatik xabarlar:**
• Qabulga yozilganingizda
• Majlisga taklif qilinganingizda
• Yangi topshiriq berilganida
• Topshiriq muddati tugashidan bir kun oldin

❓ **Yordam kerakmi?**
Administrator bilan bog'laning: @admin

🔧 **Texnik yordam:**
Agar bot ishlamayotgan bo'lsa, /start buyrug'ini qaytadan bosing.
  `, {
    parse_mode: 'Markdown'
  });
});

// Handle unknown commands
bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/') && !msg.text.match(/\/(start|profile|tasks|history|help|settings)/)) {
    bot.sendMessage(msg.chat.id, `
❓ Noma'lum buyruq: ${msg.text}

📋 Mavjud buyruqlar uchun /help ni bosing.
    `);
  }
});

// Make notification service globally available
global.telegramNotificationService = notificationService;

// Export bot for use in other modules
module.exports = { bot, notificationService };