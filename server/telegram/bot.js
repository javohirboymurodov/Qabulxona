require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('../config/db');
const Employee = require('../models/Employee');
const NotificationService = require('./services/notificationService');

// Disable polling initially and use manual control
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: false // Completely disable auto-polling
});

// Initialize notification service
const notificationService = new NotificationService(bot);

// Global export for other modules
global.telegramNotificationService = notificationService;

// Connect to database
connectDB();

// Bot state
let isPolling = false;
let pollingRetries = 0;
const MAX_RETRIES = 3;
let pollingTimeout = null;

// In-memory map for callback tokens
const chatTaskTokenMap = new Map();

// Safe bot start function
// Clean bot start with comprehensive conflict resolution
async function startBotSafely() {
  if (isPolling) {
    console.log('⚠️ Bot is already running');
    return;
  }

  try {
    console.log('🔄 Starting Telegram bot...');
    
    // Step 1: Test bot token
    const me = await bot.getMe();
    console.log(`🤖 Bot verified: @${me.username}`);
    
    // Step 2: Force clean any webhooks
    try {
      await bot.deleteWebHook({ drop_pending_updates: true });
      console.log('✅ Webhooks cleared');
    } catch (err) {
      console.log('⚠️ Webhook clear failed (might be OK):', err.message);
    }
    
    // Step 3: Clear any pending updates
    try {
      const updates = await bot.getUpdates({ timeout: 1, limit: 100 });
      if (updates && updates.length > 0) {
        const lastId = updates[updates.length - 1].update_id;
        await bot.getUpdates({ offset: lastId + 1, timeout: 1 });
        console.log(`✅ Cleared ${updates.length} pending updates`);
      }
    } catch (err) {
      console.log('⚠️ Update clear failed:', err.message);
    }
    
    // Step 4: Wait a bit to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Start polling with enhanced options
    await bot.startPolling({
      interval: 3000,
      params: {
        timeout: 10,
        allowed_updates: ['message', 'callback_query', 'inline_query']
      }
    });
    
    isPolling = true;
    pollingRetries = 0;
    console.log('🎉 Telegram bot started successfully!');
    
    // Initialize schedulers after successful start
    setTimeout(() => {
      try {
        const { initializeSchedulers } = require('./scheduler/reminderScheduler');
        initializeSchedulers();
        console.log('📅 Schedulers initialized');
      } catch (err) {
        console.log('⚠️ Scheduler init failed:', err.message);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Bot start failed:', error.message);
    isPolling = false;
    
    // Handle specific error types
    if (error.message.includes('409')) {
      console.log('🔄 Conflict detected, waiting before retry...');
      
      if (pollingRetries < MAX_RETRIES) {
        pollingRetries++;
        const delay = Math.min(10000 * pollingRetries, 60000); // Max 1 minute
        console.log(`⏳ Retry ${pollingRetries}/${MAX_RETRIES} in ${delay/1000}s...`);
        
        pollingTimeout = setTimeout(() => {
          startBotSafely();
        }, delay);
      } else {
        console.error('💔 Max retries reached. Bot startup failed.');
        console.log('💡 Please check if another bot instance is running');
      }
    } else {
      console.error('💔 Bot startup failed with non-conflict error');
    }
  }
}

// Enhanced error handling
bot.on('polling_error', (error) => {
  console.error('🔴 Polling error:', error.message);
  
  // Stop current polling
  isPolling = false;
  
  // Handle 409 conflicts more aggressively
  if (error.message.includes('409')) {
    console.log('🛑 Stopping due to 409 conflict');
    
    try {
      bot.stopPolling();
    } catch (e) {
      console.log('⚠️ Stop polling failed:', e.message);
    }
    
    // Don't auto-restart on 409 to prevent loops
    console.log('💡 Not auto-restarting due to conflict. Manual intervention needed.');
    return;
  }
  
  // Auto-restart on other errors (with limit)
  if (pollingRetries < MAX_RETRIES) {
    console.log('🔄 Attempting restart due to non-conflict error...');
    pollingRetries++;
    
    pollingTimeout = setTimeout(() => {
      startBotSafely();
    }, 5000);
  }
});

bot.on('error', (error) => {
  console.error('🔴 Bot error:', error.message);
  if (error.message.includes('409')) {
    isPolling = false;
    console.log('🛑 Bot disabled due to conflict');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down bot...');
  
  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
  }
  
  if (isPolling) {
    try {
      await bot.stopPolling();
      console.log('✅ Bot stopped');
    } catch (error) {
      console.log('⚠️ Stop error:', error.message);
    }
  }
  
  process.exit(0);
});

// Initialize bot after a delay to ensure server is ready
setTimeout(() => {
  console.log('🚀 Initializing Telegram bot...');
  startBotSafely();
}, 3000);

// All your existing bot handlers remain the same...
// Start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  console.log(`New user started bot: ${user.first_name} ${user.last_name} (@${user.username})`);
  
  try {
    // Check if user is already registered
    const existingEmployee = await Employee.findOne({ telegramId: chatId.toString() });
    
    if (existingEmployee) {
      // Ro'yxatdan o'tgan foydalanuvchini asosiy oynaga yo'naltiramiz
      bot.sendMessage(chatId, `
🏠 **Асосий меню**

Қуйидаги тугмалардан бирини танланг:
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👤 Профил', callback_data: 'profile' }
            ],
            [
              { text: '📋 Тошриқлар', callback_data: 'task_history' },
              { text: '🏢 Қабуллар', callback_data: 'receptions' }
            ],
            [
              { text: '🤝 Мажлислар', callback_data: 'meetings' },
              { text: '⚙️ Созламалар', callback_data: 'settings' }
            ]
          ]
        }
      });
      return;
    }
    
    // Request phone number
    bot.sendMessage(chatId, `
👋 Ассалому алайкум, ${user.first_name}!

Қабулхона ботига хуш келибсиз! 

📝 Рўйхатдан ўтиш учун телефона рақамини юбориш керак.

⚠️ Телефона рақами системада рўйхатга олинган бўлиши шарт!
    `, {
      reply_markup: {
        keyboard: [
          [{
            text: '📱 Телефона рақамини юбориш',
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
❌ Афсус, сизнинг телефона рақамингиз (${contact.phone_number}) системада топилмади.

🔍 Итлимос, қуйидагиларни текширинг:
• Телефона рақами тўғри киритилганми
• Системада рўйхатдан ўтганмисиз

📞 Агар муаммо давом қилса, администратор билан боғланинг.
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
⚠️ Бу телефона рақами бошқа Telegram аккаунт билан боғланган.

Агар бу сизнинг рақамингиз бўлса, администратор билан боғланинг.
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
    
    // Ro'yxatdan o'tgandan so'ng asosiy oynaga yo'naltiramiz
    bot.sendMessage(chatId, `
🏠 **Асосий меню**

Қуйидаги тугмалардан бирини танланг:
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👤 Профил', callback_data: 'profile' }
          ],
          [
            { text: '📋 Тошриқлар', callback_data: 'task_history' },
            { text: '🏢 Қабуллар', callback_data: 'receptions' }
          ],
          [
            { text: '🤝 Мажлислар', callback_data: 'meetings' },
            { text: '⚙️ Созламалар', callback_data: 'settings' }
          ]
        ]
      }
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
👤 **Шахсий маълумотлар**

📝 **Ism:** ${employee.name}
🏢 **Лавозим:** ${employee.position}  
🏛️ **Бўлим:** ${employee.department}
📱 **Телефон:** ${employee.phone}
⏰ **Иш стажи:** ${employee.experience} yil
${employee.education ? `🎓 **Таълим:** ${employee.education}` : ''}

📊 **Topshiriqlar statistikasi:**
• Фаол тошриқлар: ${activeTasks}
• Бажарилган: ${completedTasks}
• Жами: ${employee.taskHistory.length}

📅 **Рўйхатдан ўтган:** ${employee.createdAt.toLocaleDateString('uz-UZ')}
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
      bot.sendMessage(chatId, '❌ Сиз рўйхатдан ўтмагансиз. /start буйруғини босинг.');
      return;
    }
    
    const activeTasks = employee.taskHistory.filter(task => task.status === 'pending');
    
    if (activeTasks.length === 0) {
      bot.sendMessage(chatId, '📋 Сизда ҳозирча фаол тошриқлар йўқ.');
      return;
    }
    
    let message = `📋 **Фаол тошриқлар (${activeTasks.length}):**\n\n`;
    
    activeTasks.forEach((task, index) => {
      const deadline = new Date(task.deadline);
      const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
      const priorityEmoji = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟡' : '🟢';
      
      message += `${index + 1}. ${priorityEmoji} **${task.description}**\n`;
      message += `   📅 Муддат: ${deadline.toLocaleDateString('uz-UZ')}\n`;
      message += `   ⏰ Қолган: ${daysLeft > 0 ? `${daysLeft} kun` : 'Muddati o\'tgan'}\n`;
      message += `   👤 Ким бериган: ${task.assignedBy}\n\n`;
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
      bot.sendMessage(chatId, '❌ Сиз рўйхатдан ўтмагансиз. /start буйруғини босинг.');
      return;
    }
    
    if (employee.taskHistory.length === 0) {
      bot.sendMessage(chatId, '📋 Тошриқлар тарихи бўш.');
      return;
    }
    
    const recentTasks = employee.taskHistory
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
      .slice(0, 10); // So'nggi 10 ta topshiriq
    
    let message = `📚 **Сўнги тошриқлар (${recentTasks.length}/${employee.taskHistory.length}):**\n\n`;
    
    recentTasks.forEach((task, index) => {
      const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'overdue' ? '❌' : '⏳';
      const assignedDate = new Date(task.assignedAt);
      
      message += `${index + 1}. ${statusEmoji} **${task.description}**\n`;
      message += `   📅 Берилган: ${assignedDate.toLocaleDateString('uz-UZ')}\n`;
      message += `   📊 Холат: ${task.status === 'completed' ? 'Бажарилган' : task.status === 'overdue' ? 'Муддати ўтган' : 'Жараёнда'}\n`;
      if (task.completedAt) {
        message += `   ✅ Бажарилган: ${new Date(task.completedAt).toLocaleDateString('uz-UZ')}\n`;
      }
      message += '\n';
    });
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
  } catch (error) {
    console.error('History command error:', error);
    bot.sendMessage(chatId, '❌ Тарихни олишда хатолик юз берди.');
  }
});

// Handle callback queries (inline keyboard)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  // Answer callback query to remove loading indicator
  await bot.answerCallbackQuery(callbackQuery.id);

  try {
    // Handle main menu first
    if (data === 'main_menu') {
      bot.sendMessage(chatId, `
🏠 **Асосий меню**

Қуйидаги тугмалардан бирини танланг:
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👤 Профил', callback_data: 'profile' }
            ],
            [
              { text: '📋 Тошриқлар', callback_data: 'task_history' },
              { text: '🏢 Қабуллар', callback_data: 'receptions' }
            ],
            [
              { text: '🤝 Мажлислар', callback_data: 'meetings' },
              { text: '⚙️ Созламалар', callback_data: 'settings' }
            ]
          ]
        }
      });
      return;
    }

    const employee = await Employee.findOne({ telegramId: chatId.toString() });
    
    if (!employee) {
      bot.sendMessage(chatId, '❌ Сиз рўйхатдан ўтмагансиз. /start буйруғини босинг.');
      return;
    }

    // Handle short-token task view first (vt_<token>)
    if (data.startsWith('vt_')) {
      const token = data.slice(3);
      const tokenMap = chatTaskTokenMap.get(chatId);
      const task = tokenMap ? tokenMap.get(token) : null;
      console.log('[CBQ] vt_ token received', { chatId, token, hasTask: !!task });
      if (!task) {
        await bot.sendMessage(chatId, '❌ Топшириқ топилмади ёки муддати ўтган.');
      } else {
        const assignedDate = task.assignedAt ? new Date(task.assignedAt) : null;
        const deadlineDate = task.deadline ? new Date(task.deadline) : null;
        const statusText = task.status === 'completed' ? 'Бажарилган' : task.status === 'overdue' ? 'Муддати ўтган' : 'Жараёнда';
        await bot.sendMessage(chatId, `
📋 **Сизнинг тошриғингиз**

📝 **Tavsif:** ${task.description || '-'}
📅 **Берилган сана:** ${assignedDate ? assignedDate.toLocaleDateString('uz-UZ') : '-'}
⏰ **Муддат:** ${deadlineDate ? deadlineDate.toLocaleDateString('uz-UZ') : '-'}
📊 **Холат:** ${statusText}
👤 **Ким бериган:** ${task.assignedBy || 'Admin'}
        `, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Орқага', callback_data: 'task_history' }]] }
        });
      }
      return;
    }

    switch(data) {
      case 'profile':
        await handleProfileCommand(chatId, employee);
        break;
      case 'task_history':
        await handleTaskHistoryCommand(chatId, employee);
        break;
      case 'receptions':
        await handleReceptionsCommand(chatId, employee);
        break;
      case 'meetings':
        await handleMeetingsCommand(chatId, employee);
        break;
      case 'settings':
        await handleSettingsCommand(chatId, employee);
        break;
      // Pagination handlers
      case data.match(/^tasks_page_(\d+)$/)?.input:
        const taskPage = parseInt(data.split('_')[2]);
        await handleTaskHistoryCommand(chatId, employee, taskPage, messageId);
        break;
      case data.match(/^receptions_page_(\d+)$/)?.input:
        const receptionPage = parseInt(data.split('_')[2]);
        await handleReceptionsCommand(chatId, employee, receptionPage, messageId);
        break;
      case data.match(/^meetings_page_(\d+)$/)?.input:
          const meetingPage = parseInt(data.split('_')[2]);
          await handleMeetingsCommand(chatId, employee, meetingPage, messageId);
          break;
      // Info handlers (just show current page info)
      case 'tasks_info':
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Тошриқлар тарихи саҳифаси' });
        break;
      case 'receptions_info':
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Қабуллар тарихи саҳифаси' });
        break;
      case 'meetings_info':
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Мажлислар тарихи саҳифаси' });
        break;
      // Inline button handlers
      case data.match(/^view_task_(.+)$/)?.input:
        const viewTaskId = data.split('_')[2];
        await handleViewTask(chatId, employee, viewTaskId);
        break;
      case data.match(/^view_reception_doc_(.+)$/)?.input:
        const viewReceptionDocId = data.split('_')[3];
        await handleViewReception(chatId, employee, viewReceptionDocId);
        break;
      case data.match(/^view_meeting_(.+)$/)?.input:
        const viewMeetingId = data.split('_')[2];
        await handleViewMeeting(chatId, employee, viewMeetingId);
        break;
      default:
        bot.sendMessage(chatId, '❓ Номаълум буйруқ');
    }
  } catch (error) {
    console.error('Callback query error:', error);
    bot.sendMessage(chatId, '❌ Хатолик юз берди');
  }
});

// Helper function to update task status based on deadline
function updateTaskStatus(task) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  
  if (task.status === 'completed') {
    return task; // Don't change completed tasks
  }
  
  if (deadline < now) {
    return { ...task, status: 'overdue' };
  }
  
  return task;
}

// Refactored command handlers
async function handleProfileCommand(chatId, employee) {
  // Load freshest employee + reception tasks to reflect real counts
  const fresh = await Employee.findById(employee._id);
  const source = fresh || employee;
  const baseTasks = source?.taskHistory || employee.taskHistory || [];
  let receptionTasks = [];
  try {
    const ReceptionHistory = require('../models/ReceptionHistory');
    const docs = await ReceptionHistory.find({ 'employees.employeeId': employee._id }).limit(200);
    docs.forEach(doc => {
      const emp = doc.employees.find(e => (e.employeeId?.toString() || e._id?.toString()) === employee._id.toString());
      if (emp && emp.task) receptionTasks.push(emp.task);
    });
  } catch (_) {}

  // Combine and count by status
  const allTasksForStats = [...baseTasks, ...receptionTasks];
  const activeTasks = allTasksForStats.filter(t => t.status === 'pending').length;
  const completedTasks = allTasksForStats.filter(t => t.status === 'completed').length;
  const totalTasks = allTasksForStats.length;

  bot.sendMessage(chatId, `
👤 **Шахсий маълумотлар**

📝 **Исм:** ${employee.name}
🏢 **Лавозим:** ${employee.position}  
🏛️ **Бўлим:** ${employee.department}
📱 **Телефон:** ${employee.phone}
⏰ **Иш стажи:** ${employee.experience} yil
${employee.education ? `🎓 **Таълим:** ${employee.education}` : ''}

📊 **Тошриқлар статистикasi:**
• Фаол тошриқлар: ${activeTasks}
• Бажарилган: ${completedTasks}
• Жами: ${totalTasks}

📅 **Рўйхатдан ўтган:** ${employee.createdAt.toLocaleDateString('uz-UZ')}
  `, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }
        ]
      ]
    }
  });
}

async function handleTasksCommand(chatId, employee) {
  const activeTasks = employee.taskHistory ? employee.taskHistory.filter(task => task.status === 'pending') : [];
  
  if (activeTasks.length === 0) {
    bot.sendMessage(chatId, '📋 Сизда ҳозирча фаол тошриқлар йўқ.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
        ]
      }
    });
    return;
  }
  
  let message = `📋 **Фаол тошриқлар (${activeTasks.length}):**\n\n`;
  
  activeTasks.forEach((task, index) => {
    const deadline = new Date(task.deadline);
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    const priorityEmoji = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟡' : '🟢';
    
    message += `${index + 1}. ${priorityEmoji} **${task.description}**\n`;
    message += `   📅 Муддат: ${deadline.toLocaleDateString('uz-UZ')}\n`;
    message += `   ⏰ Қолган: ${daysLeft > 0 ? `${daysLeft} kun` : 'Муддати ўтган'}\n`;
    message += `   👤 Ким берган: ${task.assignedBy}\n\n`;
  });
}

async function handleSettingsCommand(chatId, employee) {
  const settings = employee.notificationSettings || {};
  
  bot.sendMessage(chatId, `
⚙️ **Хабар созламалари**

📋 **Жорий созламалар:**
• Қабул хабарлари: ${settings.receptionNotification !== false ? '✅' : '❌'}
• Мажлислар хабарлари: ${settings.meetingNotification !== false ? '✅' : '❌'}
• Тошриқлар хабарлари: ${settings.taskNotification !== false ? '✅' : '❌'}
• Еслатма хабарлари: ${settings.reminderNotification !== false ? '✅' : '❌'}

*Созламаларни ўзгартириш учун администратор билан боғланинг*
  `, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Handle unknown commands
bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/') && !msg.text.match(/\/(start|profile|tasks|history|settings)/)) {
    bot.sendMessage(msg.chat.id, `
❓ Номаълум буйруқ: ${msg.text}

📋 Асосий саҳифага ўтиш учун /start ни босинг.
    `, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Асосий саҳифа', callback_data: 'main_menu' }]
        ]
      }
    });
  }
});

// New history functions
async function handleTaskHistoryCommand(chatId, employee, page = 1, messageId = null) {
  // Always reload to reflect admin-side updates (e.g., completed)
  const freshEmployee = await Employee.findOne({ telegramId: chatId.toString() });
  const source = freshEmployee || employee;

  // Also load latest reception tasks to sync statuses (admin may update there)
  const unifiedReceptionTasks = [];
  try {
    const ReceptionHistory = require('../models/ReceptionHistory');
    const docs = await ReceptionHistory.find({ 'employees.employeeId': source._id }).limit(200);
    docs.forEach(doc => {
      const emp = doc.employees.find(e => (e.employeeId?.toString() || e._id?.toString()) === source._id.toString());
      if (emp && emp.task) {
        // Normalize to the same shape as employee.taskHistory items
        const assignedAt = emp.task.assignedAt ? new Date(emp.task.assignedAt) : new Date(doc.date || Date.now());
        // Convert deadline: may be a Date (taskHistory) or number of days (reception)
        let deadlineDate = null;
        if (emp.task.deadline instanceof Date || typeof emp.task.deadline === 'string') {
          const d = new Date(emp.task.deadline);
          if (!isNaN(d.getTime())) deadlineDate = d;
        } else if (typeof emp.task.deadline === 'number') {
          deadlineDate = new Date(assignedAt.getTime() + emp.task.deadline * 24 * 60 * 60 * 1000);
        }
        unifiedReceptionTasks.push({
          _id: `reception_${doc._id}_${emp._id}`,
          description: emp.task.description,
          deadline: deadlineDate,
          assignedAt,
          assignedBy: emp.task.assignedBy || 'Admin',
          status: emp.task.status || 'pending',
          source: 'reception'
        });
      }
    });
  } catch (_) {}

  // For history view, we ONLY show tasks assigned via reception
  if (unifiedReceptionTasks.length === 0) {
    if (messageId) {
      bot.editMessageText('📋 Тошриқлар тарихи бўш.', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, '📋 Тошриқлар тарихи бўш.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    return;
  }
  
  // Deduplicate by description+assignedAt timestamp
  const mergedTasks = [...unifiedReceptionTasks];
  const seen = new Set();
  const mergedUnique = mergedTasks.filter(t => {
    const key = `${t.description || ''}_${new Date(t.assignedAt || t.deadline || 0).getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const allTasks = mergedUnique
    .map(task => updateTaskStatus(task))
    // Sort by most recent deadline first; fallback to assignedAt/createdAt
    .sort((a, b) => {
      const aTime = new Date(a.deadline || a.assignedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.deadline || b.assignedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  
  const itemsPerPage = 5;
  const totalPages = Math.ceil(allTasks.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const recentTasks = allTasks.slice(startIndex, endIndex);
  
  let message = `📋 **Топшириқлар тарихи (${page}/${totalPages}):**\n\n`;
  
  // Build short-token map per chat to avoid long callback_data
  let tokenMap = chatTaskTokenMap.get(chatId);
  if (!tokenMap) {
    tokenMap = new Map();
    chatTaskTokenMap.set(chatId, tokenMap);
  }
  // Reset for this render
  tokenMap.clear();
  
  // Inline buttons for each task - soddalashtirilgan
  const keyboard = [];
  
  recentTasks.forEach((task, index) => {
    const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'overdue' ? '❌' : '⏳';
    const displayDateRaw = task.assignedAt || task.deadline || task.createdAt;
    const displayDate = displayDateRaw ? new Date(displayDateRaw).toLocaleDateString('uz-UZ') : '-';
    const taskIndex = startIndex + index;
    
    const statusText = task.status === 'completed' ? 'Бажарилган' : task.status === 'overdue' ? 'Муддати ўтган' : 'Жараёнда';
    const taskButton = `${startIndex + index + 1}. ${statusEmoji} ${displayDate} - ${statusText}`;
    const token = `t${taskIndex}`;
    tokenMap.set(token, task);
    keyboard.push([{ text: taskButton, callback_data: `vt_${token}` }]);
  });
  
  if (totalPages > 1) {
    const paginationRow = [];
    if (page > 1) {
      paginationRow.push({ text: '◀️', callback_data: `tasks_page_${page - 1}` });
    }
    paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'tasks_info' });
    if (page < totalPages) {
      paginationRow.push({ text: '▶️', callback_data: `tasks_page_${page + 1}` });
    }
    keyboard.push(paginationRow);
  }
  keyboard.push([{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]);
  
  if (messageId) {
    // Mavjud xabarni yangilash
    try {
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Xabarni yangilashda xatolik:', error);
      // Agar xabar yangilanmasa, yangi xabar yuborish
      bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
  } else {
    // Yangi xabar yuborish
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }
}

async function handleReceptionsCommand(chatId, employee, page = 1, messageId = null) {
  try {
    const ReceptionHistory = require('../models/ReceptionHistory');
    // Load latest receptions where this employee participated
    const docs = await ReceptionHistory.find({ 'employees.employeeId': employee._id })
      .sort({ date: -1 })
      .limit(100); // limit to reasonable recent history

    if (!docs || docs.length === 0) {
      if (messageId) {
        bot.editMessageText('🏢 Қабуллар тарихи бўш.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]] }
        });
      } else {
        bot.sendMessage(chatId, '🏢 Қабуллар тарихи бўш.', {
          reply_markup: { inline_keyboard: [[{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]] }
        });
      }
      return;
    }

    // Flatten receptions with employee-specific status/time
    const allReceptions = [];
    docs.forEach(doc => {
      const emp = doc.employees.find(e => (e.employeeId?.toString() || e._id?.toString()) === employee._id.toString());
      if (emp) {
        allReceptions.push({
          docId: doc._id.toString(),
          date: doc.date,
          status: emp.status || 'waiting',
          time: emp.scheduledTime || emp.time || '—'
        });
      }
    });

    const itemsPerPage = 5;
    const totalPages = Math.ceil(allReceptions.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const recentReceptions = allReceptions.slice(startIndex, endIndex);

    let message = `🏢 **Қабуллар тарихи (${page}/${totalPages}):**\n\n`;
    const keyboard = [];

    recentReceptions.forEach((r, index) => {
      const statusEmoji = r.status === 'present' ? '✅' : r.status === 'absent' ? '❌' : '⏳';
      const receptionDate = r.date ? new Date(r.date) : null;
      const labelDate = receptionDate ? receptionDate.toLocaleDateString('uz-UZ') : '-';
      const timeLabel = r.time && r.time !== '—' ? ` ${r.time}` : '';
      const btn = `${startIndex + index + 1}. ${statusEmoji} ${labelDate}${timeLabel} - ${r.status === 'present' ? 'Келди' : r.status === 'absent' ? 'Келмади' : 'Кутилмоқда'}`;
      keyboard.push([{ text: btn, callback_data: `view_reception_doc_${r.docId}` }]);
    });

    if (totalPages > 1) {
      const paginationRow = [];
      if (page > 1) paginationRow.push({ text: '◀️', callback_data: `receptions_page_${page - 1}` });
      paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'receptions_info' });
      if (page < totalPages) paginationRow.push({ text: '▶️', callback_data: `receptions_page_${page + 1}` });
      keyboard.push(paginationRow);
    }
    keyboard.push([{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]);

    if (messageId) {
      // Mavjud xabarni yangilash
      try {
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      } catch (error) {
        console.error('Xabarni yangilashda xatolik:', error);
        // Agar xabar yangilanmasa, yangi xabar yuborish
        bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      }
    } else {
      // Yangi xabar yuborish
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
    }
  } catch (err) {
    console.error('Receptions history load error:', err);
    bot.sendMessage(chatId, '❌ Қабуллар тарихини юклашда хатолик.');
  }
}

async function handleMeetingsCommand(chatId, employee, page = 1, messageId = null) {
  if (!employee.meetingHistory || employee.meetingHistory.length === 0) {
    if (messageId) {
      bot.editMessageText('🤝 Мажлислар тарихи бўш.', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, '🤝 Мажлислар тарихи бўш.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    return;
  }
  
  try {
    // OPTIMIZED: Populate meeting details from Meeting collection
    const Employee = require('../models/Employee');
    const populatedEmployee = await Employee.findById(employee._id)
      .populate({
        path: 'meetingHistory.meetingId',
        select: 'name date time location description'
      });
    
    if (!populatedEmployee || !populatedEmployee.meetingHistory) {
      throw new Error('Failed to load meeting details');
    }
    
    let allMeetings = populatedEmployee.meetingHistory
      .filter(m => m.meetingId) // Only show
      .sort((a, b) => new Date(b.joinedAt || b.createdAt) - new Date(a.joinedAt || a.createdAt));
    
    const itemsPerPage = 5;
    const totalPages = Math.ceil(allMeetings.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const recentMeetings = allMeetings.slice(startIndex, endIndex);
    
    let message = `🤝 **Мажлислар тарихи (${page}/${totalPages}):**\n\n`;
    
    // Inline buttons for each meeting - soddalashtirilgan
    const keyboard = [];
    
    recentMeetings.forEach((meetingHistory, index) => {
      const meeting = meetingHistory.meetingId; // Populated meeting data
      const statusEmoji = meetingHistory.status === 'attended' ? '✅' : meetingHistory.status === 'missed' ? '❌' : '📧';
      const meetingDate = new Date(meeting.date);
      const meetingIndex = startIndex + index;
      
      // Meeting button with date and status
      const meetingButton = `${startIndex + index + 1}. ${statusEmoji} ${meetingDate.toLocaleDateString('uz-UZ')} - ${meetingHistory.status === 'attended' ? 'Қатнашган' : meetingHistory.status === 'missed' ? 'Қатнашмаган' : 'Таклиф этилган'}`;
      keyboard.push([{ text: meetingButton, callback_data: `view_meeting_${meeting._id || meetingIndex}` }]);
    });
    
    // Pagination buttons
    if (totalPages > 1) {
      const paginationRow = [];
      if (page > 1) {
        paginationRow.push({ text: '◀️', callback_data: `meetings_page_${page - 1}` });
      }
      paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'meetings_info' });
      if (page < totalPages) {
        paginationRow.push({ text: '▶️', callback_data: `meetings_page_${page + 1}` });
      }
      keyboard.push(paginationRow);
    }
    keyboard.push([{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]);
    
    if (messageId) {
      // Mavjud xabarni yangilash
      try {
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      } catch (error) {
        console.error('Xabarni yangilashda xatolik:', error);
        // Agar xabar yangilanmasa, yangi xabar yuborish
        bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      }
    } else {
      // Yangi xabar yuborish
      bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
    
  } catch (error) {
    console.error('Error loading meeting history:', error);
    bot.sendMessage(chatId, '❌ Мажлислар тарихини юклашда хатолик.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Асосий саҳифа', callback_data: 'main_menu' }]
        ]
      }
    });
  }
}

// Inline button handlers
async function handleViewTask(chatId, employee, taskId) {
  try {
    // User faqat o'z topshiriqlarini ko'radi
    const task = employee.taskHistory.find(t => t._id?.toString() === taskId || t.id?.toString() === taskId);
    if (!task) {
      bot.sendMessage(chatId, '❌ Сизнинг тошриғингиз топилмади');
      return;
    }
    
    const assignedDate = new Date(task.assignedAt);
    const deadlineDate = new Date(task.deadline);
    const statusText = task.status === 'completed' ? 'Бажарилган' : 
                      task.status === 'overdue' ? 'Муддати ўтган' : 'Жараёнда';
    
    bot.sendMessage(chatId, `
📋 **Сизнинг тошриғингиз**

📝 **Taвсифи:** ${task.description}
📅 **Berilgan sana:** ${assignedDate.toLocaleDateString('uz-UZ')}
⏰ **Муддат:** ${deadlineDate.toLocaleDateString('uz-UZ')}
📊 **Ҳолат:** ${statusText}
👤 **Ким берган:** ${task.assignedBy}
${task.completedAt ? `✅ **Бажарилган:** ${new Date(task.completedAt).toLocaleDateString('uz-UZ')}` : ''}
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Орқага', callback_data: 'task_history' }]
        ]
      }
    });
  } catch (error) {
    console.error('View task error:', error);
    bot.sendMessage(chatId, '❌ Тошриқни кўришда хатолик');
  }
}

async function handleViewReception(chatId, employee, receptionDocId) {
  try {
    const ReceptionHistory = require('../models/ReceptionHistory');
    const doc = await ReceptionHistory.findById(receptionDocId);
    if (!doc) {
      bot.sendMessage(chatId, '❌ Қабул топилмади');
      return;
    }
    const emp = doc.employees.find(e => (e.employeeId?.toString() || e._id?.toString()) === employee._id.toString());
    if (!emp) {
      bot.sendMessage(chatId, '❌ Сизнинг қабулингиз топилмади');
      return;
    }
    const receptionDate = doc.date ? new Date(doc.date) : null;
    const currentStatus = emp.status || 'waiting';
    const statusText = currentStatus === 'present' ? 'Келди' : currentStatus === 'absent' ? 'Келмади' : 'Кутилмоқда';
    const timeText = emp.scheduledTime || emp.time || '-';
    
    let message = `🏢 **Сизнинг қабулингиз**\n\n`;
    message += `📅 **Сана:** ${receptionDate ? receptionDate.toLocaleDateString('uz-UZ') : '-'}\n`;
    message += `⏰ **Вақт:** ${timeText}\n`;
    message += `📊 **Ҳолат:** ${statusText}\n`;
    
    if (currentStatus === 'present' && emp.task) {
      message += `\n📋 **Берилган вазифа:**\n`;
      message += `📝 **Taвсифи:** ${emp.task.description}\n`;
      message += `⏰ **Муддат:** ${emp.task.deadline} kun\n`;
      message += `👤 **Ким берган:** ${emp.task.assignedBy}\n`;
    } else if (currentStatus === 'absent') {
      message += `\n❌ **Сиз қабулга келмадингиз**\n`;
    }
    
    if (emp.notes) {
      message += `\n📝 **Изоҳ:** ${emp.notes}`;
    }
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Орқага', callback_data: 'receptions' }]
        ]
      }
    });
  } catch (error) {
    console.error('View reception error:', error);
    bot.sendMessage(chatId, '❌ Қабулни кўришда хатолик');
  }
}

async function handleViewMeeting(chatId, employee, meetingId) {
  try {
    // Reload to ensure freshest data
    const freshEmployee = await Employee.findOne({ telegramId: chatId.toString() }).populate({ path: 'meetingHistory.meetingId' });
    const source = freshEmployee || employee;

    const meetingHistory = source.meetingHistory.find(m => m.meetingId?._id?.toString() === meetingId);
    if (!meetingHistory) {
      bot.sendMessage(chatId, '❌ Сизнинг мажлисингиз топилмади');
      return;
    }
    
    const meeting = meetingHistory.meetingId || {};
    const meetingDateObj = meeting.date ? new Date(meeting.date) : null;
    const statusText = meetingHistory.status === 'attended' ? 'Қатнашган' : 
                      meetingHistory.status === 'missed' ? 'Қатнашмаган' : 'Таклиф этилган';
    const name = meeting.name || '-';
    const dateText = meetingDateObj ? meetingDateObj.toLocaleDateString('uz-UZ') : '-';
    const timeText = meeting.time || '-';
    const locationText = meeting.location || 'Белгиланмаган';
    const descText = meeting.description ? `📄 **Taвсифи:** ${meeting.description}` : '';
    const notesText = meetingHistory.notes ? `📝 **Эслатама:** ${meetingHistory.notes}` : '';
    
    bot.sendMessage(chatId, `
🤝 **Сизнинг мажлисингиз**

📝 **Номи:** ${name}
📅 **Сана:** ${dateText}
⏰ **Вақт:** ${timeText}
📍 **Жой:** ${locationText}
📊 **Ҳолат:** ${statusText}
${descText}
${notesText}
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Орқага', callback_data: 'meetings' }]
        ]
      }
    });
  } catch (error) {
    console.error('View meeting error:', error);
    bot.sendMessage(chatId, '❌ Мажлисни кўришда хатолик');
  }
}

// Make notification service globally available
global.telegramNotificationService = notificationService;

// Export bot for use in other modules
module.exports = { bot, notificationService };