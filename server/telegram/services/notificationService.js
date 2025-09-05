const Employee = require('../../models/Employee');
const dayjs = require('dayjs');

class NotificationService {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Send reception notification to employee
   */
  async sendReceptionNotification(employeeId, receptionData) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId || !employee.notificationSettings.receptionNotification) {
        console.log(`Cannot send reception notification to employee ${employeeId}: ${!employee ? 'Not found' : !employee.telegramId ? 'No Telegram ID' : 'Notifications disabled'}`);
        return false;
      }

      const message = `
📋 **Qabulga yozildingiz!**

📅 **Sana:** ${dayjs(receptionData.date).format('DD.MM.YYYY')}
⏰ **Vaqt:** ${receptionData.time || 'Belgilanmagan'}
📍 **Manzil:** Qabulxona
${receptionData.notes ? `📝 **Qo'shimcha:** ${receptionData.notes}` : ''}

✅ Vaqtida keling va zarur hujjatlaringizni olib keling.

🔔 Bu xabar avtomatik yuborildi.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Reception notification sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending reception notification:', error);
      return false;
    }
  }

  /**
   * Send reception status update notification to employee
   */
  async sendReceptionStatusUpdateNotification(employeeId, statusData) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId || !employee.notificationSettings.receptionNotification) {
        console.log(`Cannot send reception status update notification to employee ${employeeId}: ${!employee ? 'Not found' : !employee.telegramId ? 'No Telegram ID' : 'Notifications disabled'}`);
        return false;
      }

      const statusText = {
        'waiting': '⏳ Kutilmoqda',
        'present': '✅ Keldi',
        'absent': '❌ Kelmadi'
      };

      const message = `
🔄 **Qabul holati yangilandi!**

📅 **Sana:** ${dayjs(statusData.date).format('DD.MM.YYYY')}
⏰ **Vaqt:** ${statusData.time || 'Belgilanmagan'}
📊 **Yangi holat:** ${statusText[statusData.status] || statusData.status}
${statusData.notes ? `📝 **Qo'shimcha:** ${statusData.notes}` : ''}

🔔 Bu xabar avtomatik yuborildi.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Reception status update notification sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending reception status update notification:', error);
      return false;
    }
  }

  /**
   * Send meeting notification to employee
   */
  async sendMeetingNotification(employeeId, meetingData) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId || !employee.notificationSettings.meetingNotification) {
        console.log(`Cannot send meeting notification to employee ${employeeId}: ${!employee ? 'Not found' : !employee.telegramId ? 'No Telegram ID' : 'Notifications disabled'}`);
        return false;
      }

      const participants = meetingData.participants || [];
      const participantNames = participants
        .filter(p => p._id.toString() !== employeeId.toString())
        .map(p => p.name)
        .join(', ');

      const message = `
🏢 **Majlisga taklif qilindingiz!**

📝 **Mavzu:** ${meetingData.name}
📅 **Sana:** ${dayjs(meetingData.date).format('DD.MM.YYYY')}
⏰ **Vaqt:** ${meetingData.time}
📍 **Joy:** ${meetingData.location || 'Belgilanmagan'}
${meetingData.description ? `📄 **Tavsif:** ${meetingData.description}` : ''}

👥 **Boshqa ishtirokchilar:** ${participantNames || 'Faqat siz'}

⚠️ Vaqtida keling!

🔔 Bu xabar avtomatik yuborildi.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Meeting notification sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending meeting notification:', error);
      return false;
    }
  }

  /**
   * Send meeting update notification to employee
   */
  async sendMeetingUpdateNotification(employeeId, meetingData) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId || !employee.notificationSettings.meetingNotification) {
        console.log(`Cannot send meeting update notification to employee ${employeeId}: ${!employee ? 'Not found' : !employee.telegramId ? 'No Telegram ID' : 'Notifications disabled'}`);
        return false;
      }

      const actionText = meetingData.action === 'updated' ? 'Yangilandi' : 'O\'zgartirildi';
      const actionEmoji = meetingData.action === 'updated' ? '🔄' : '📝';

      const message = `
${actionEmoji} **Majlis ${actionText}!**

📝 **Mavzu:** ${meetingData.name}
📅 **Sana:** ${dayjs(meetingData.date).format('DD.MM.YYYY')}
⏰ **Vaqt:** ${meetingData.time}
📍 **Joy:** ${meetingData.location || 'Belgilanmagan'}
${meetingData.description ? `📄 **Tavsif:** ${meetingData.description}` : ''}

⚠️ Majlis ma'lumotlari o'zgartirildi. Yangi vaqtni tekshiring!

🔔 Bu xabar avtomatik yuborildi.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Meeting update notification sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending meeting update notification:', error);
      return false;
    }
  }

  /**
   * Send task assignment notification to employee
   */
  async sendTaskNotification(employeeId, taskData, assignedBy) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId || !employee.notificationSettings.taskNotification) {
        console.log(`Cannot send task notification to employee ${employeeId}: ${!employee ? 'Not found' : !employee.telegramId ? 'No Telegram ID' : 'Notifications disabled'}`);
        return false;
      }

      const deadline = dayjs(taskData.deadline);
      const daysLeft = deadline.diff(dayjs(), 'day');
      const priorityEmoji = taskData.priority === 'urgent' ? '🔴' : taskData.priority === 'high' ? '🟡' : '🟢';

      const message = `
📝 **Yangi topshiriq berildi!**

${priorityEmoji} **Tavsif:** ${taskData.description}
📅 **Muddat:** ${deadline.format('DD.MM.YYYY')}
⏰ **Qolgan vaqt:** ${daysLeft > 0 ? `${daysLeft} kun` : 'Muddati yaqin!'}
🎯 **Muhimlik:** ${this.getPriorityText(taskData.priority)}
👤 **Kim bergan:** ${assignedBy}

💡 Topshiriqni vaqtida bajarishni unutmang!

📋 Barcha topshiriqlaringizni ko'rish uchun: /tasks

🔔 Bu xabar avtomatik yuborildi.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Task notification sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending task notification:', error);
      return false;
    }
  }

  /**
   * Send task reminder notification (1 day before deadline)
   */
  async sendTaskReminder(employeeId, taskData) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId || !employee.notificationSettings.reminderNotification) {
        console.log(`Cannot send task reminder to employee ${employeeId}: ${!employee ? 'Not found' : !employee.telegramId ? 'No Telegram ID' : 'Notifications disabled'}`);
        return false;
      }

      const deadline = dayjs(taskData.deadline);
      const priorityEmoji = taskData.priority === 'urgent' ? '🔴' : taskData.priority === 'high' ? '🟡' : '🟢';

      const message = `
⚠️ **Topshiriq muddati eslatmasi!**

${priorityEmoji} **Topshiriq:** ${taskData.description}
📅 **Muddat:** ${deadline.format('DD.MM.YYYY')} (ERTAGA!)
🎯 **Muhimlik:** ${this.getPriorityText(taskData.priority)}

🚨 **Bu topshiriqning muddati ertaga tugaydi!**

✅ Agar bajargan bo'lsangiz, admin bilan bog'laning.
📋 Barcha topshiriqlaringiz: /tasks

🔔 Bu eslatma avtomatik yuborildi.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Task reminder sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending task reminder:', error);
      return false;
    }
  }

  /**
   * Send task completion notification to admin
   */
  async sendTaskCompletionNotification(employeeId, taskData, adminTelegramId) {
    try {
      if (!adminTelegramId) {
        console.log('No admin telegram ID provided for task completion notification');
        return false;
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        console.log(`Employee ${employeeId} not found for task completion notification`);
        return false;
      }

      const message = `
✅ **Topshiriq bajarildi!**

👤 **Xodim:** ${employee.name}
🏢 **Lavozim:** ${employee.position}
📝 **Topshiriq:** ${taskData.description}
📅 **Bajarilgan:** ${dayjs().format('DD.MM.YYYY HH:mm')}

🔔 Bu xabar avtomatik yuborildi.
      `;

      await this.bot.sendMessage(adminTelegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Task completion notification sent to admin (${adminTelegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending task completion notification:', error);
      return false;
    }
  }

  /**
   * Send bulk notification to multiple employees
   */
  async sendBulkNotification(employeeIds, message, parseMode = 'Markdown') {
    const results = [];
    
    for (const employeeId of employeeIds) {
      try {
        const employee = await Employee.findById(employeeId);
        
        if (!employee || !employee.telegramId) {
          results.push({ employeeId, success: false, reason: 'No Telegram ID' });
          continue;
        }

        await this.bot.sendMessage(employee.telegramId, message, {
          parse_mode: parseMode
        });

        results.push({ employeeId, success: true });
        console.log(`Bulk notification sent to ${employee.name} (${employee.telegramId})`);

      } catch (error) {
        console.error(`Error sending bulk notification to ${employeeId}:`, error);
        results.push({ employeeId, success: false, reason: error.message });
      }
    }

    return results;
  }

  /**
   * Test notification - for checking if employee can receive messages
   */
  async sendTestNotification(employeeId) {
    try {
      const employee = await Employee.findById(employeeId);
      
      if (!employee || !employee.telegramId) {
        return false;
      }

      const message = `
🧪 **Test xabari**

Salom ${employee.name}! 

Bu sizning Telegram bot bilan bog'lanishingizni tekshirish uchun test xabari.

✅ Agar bu xabarni ko'ryotgan bo'lsangiz, hamma narsa yaxshi ishlayapti!

📱 Bot buyruqlari: /help

🔔 Bu test xabari.
      `;

      await this.bot.sendMessage(employee.telegramId, message, {
        parse_mode: 'Markdown'
      });

      console.log(`Test notification sent to ${employee.name} (${employee.telegramId})`);
      return true;

    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Helper method to get priority text in Uzbek
   */
  getPriorityText(priority) {
    const priorities = {
      'low': 'Past',
      'normal': "O'rtacha", 
      'high': 'Yuqori',
      'urgent': 'Shoshilinch'
    };
    return priorities[priority] || "O'rtacha";
  }

  /**
   * Get employee's notification preferences
   */
  async getNotificationSettings(employeeId) {
    try {
      const employee = await Employee.findById(employeeId).select('notificationSettings');
      return employee ? employee.notificationSettings : null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  /**
   * Update employee's notification preferences
   */
  async updateNotificationSettings(employeeId, settings) {
    try {
      const employee = await Employee.findByIdAndUpdate(
        employeeId, 
        { notificationSettings: settings },
        { new: true }
      );
      return employee ? employee.notificationSettings : null;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return null;
    }
  }
}

module.exports = NotificationService;