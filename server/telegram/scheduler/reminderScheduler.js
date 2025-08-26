const cron = require('node-cron');
const dayjs = require('dayjs');
const Employee = require('../../models/Employee');

// Telegram notification service
const getNotificationService = () => global.telegramNotificationService || null;

/**
 * Check for tasks that are due tomorrow and send reminders
 * Runs every day at 9:00 AM
 */
const scheduleTaskReminders = () => {
  // Run every day at 9:00 AM (0 9 * * *)
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running daily task reminder check...');
    
    const notificationService = getNotificationService();
    if (!notificationService) {
      console.log('❌ Notification service not available, skipping reminders');
      return;
    }

    try {
      const tomorrow = dayjs().add(1, 'day').startOf('day');
      const dayAfterTomorrow = dayjs().add(2, 'day').startOf('day');

      console.log(`Checking for tasks due on: ${tomorrow.format('YYYY-MM-DD')}`);

      // Find all employees with pending tasks due tomorrow
      const employees = await Employee.find({
        'taskHistory': {
          $elemMatch: {
            'deadline': {
              $gte: tomorrow.toDate(),
              $lt: dayAfterTomorrow.toDate()
            },
            'status': 'pending'
          }
        },
        'telegramId': { $exists: true, $ne: null },
        'notificationSettings.reminderNotification': true
      });

      console.log(`Found ${employees.length} employees with tasks due tomorrow`);

      let remindersSent = 0;
      let remindersFailed = 0;

      for (const employee of employees) {
        // Find tasks due tomorrow
        const dueTasks = employee.taskHistory.filter(task => {
          const deadline = dayjs(task.deadline);
          return deadline.isSame(tomorrow, 'day') && task.status === 'pending';
        });

        console.log(`Employee ${employee.name} has ${dueTasks.length} tasks due tomorrow`);

        // Send reminder for each task
        for (const task of dueTasks) {
          try {
            await notificationService.sendTaskReminder(employee._id, task);
            remindersSent++;
            console.log(`✅ Reminder sent to ${employee.name} for task: ${task.description}`);
          } catch (error) {
            remindersFailed++;
            console.error(`❌ Failed to send reminder to ${employee.name}:`, error.message);
          }
        }
      }

      console.log(`🔔 Reminder check completed:`);
      console.log(`   ✅ Sent: ${remindersSent}`);
      console.log(`   ❌ Failed: ${remindersFailed}`);

    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error);
    }
  });

  console.log('🔔 Task reminder scheduler initialized (runs daily at 9:00 AM)');
};

/**
 * Check for overdue tasks and mark them as overdue
 * Runs every day at 10:00 PM
 */
const scheduleOverdueCheck = () => {
  // Run every day at 10:00 PM (0 22 * * *)
  cron.schedule('0 22 * * *', async () => {
    console.log('⏰ Running overdue task check...');

    try {
      const now = dayjs();

      // Find all employees with pending tasks that are overdue
      const employees = await Employee.find({
        'taskHistory': {
          $elemMatch: {
            'deadline': { $lt: now.toDate() },
            'status': 'pending'
          }
        }
      });

      console.log(`Found ${employees.length} employees with potentially overdue tasks`);

      let tasksMarkedOverdue = 0;

      for (const employee of employees) {
        let updated = false;

        employee.taskHistory.forEach(task => {
          const deadline = dayjs(task.deadline);
          if (deadline.isBefore(now, 'day') && task.status === 'pending') {
            task.status = 'overdue';
            tasksMarkedOverdue++;
            updated = true;
            console.log(`⏰ Marked task as overdue for ${employee.name}: ${task.description}`);
          }
        });

        if (updated) {
          await employee.save();
        }
      }

      console.log(`⏰ Overdue check completed: ${tasksMarkedOverdue} tasks marked as overdue`);

    } catch (error) {
      console.error('❌ Error in overdue task check:', error);
    }
  });

  console.log('⏰ Overdue task checker initialized (runs daily at 10:00 PM)');
};

/**
 * Manual function to check reminders (for testing)
 */
const checkRemindersNow = async () => {
  console.log('🧪 Manual reminder check started...');
  
  const notificationService = getNotificationService();
  if (!notificationService) {
    console.log('❌ Notification service not available');
    return;
  }

  try {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const dayAfterTomorrow = dayjs().add(2, 'day').startOf('day');

    const employees = await Employee.find({
      'taskHistory': {
        $elemMatch: {
          'deadline': {
            $gte: tomorrow.toDate(),
            $lt: dayAfterTomorrow.toDate()
          },
          'status': 'pending'
        }
      },
      'telegramId': { $exists: true, $ne: null }
    });

    console.log(`Found ${employees.length} employees with tasks due tomorrow`);

    for (const employee of employees) {
      const dueTasks = employee.taskHistory.filter(task => {
        const deadline = dayjs(task.deadline);
        return deadline.isSame(tomorrow, 'day') && task.status === 'pending';
      });

      for (const task of dueTasks) {
        await notificationService.sendTaskReminder(employee._id, task);
        console.log(`✅ Manual reminder sent to ${employee.name}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in manual reminder check:', error);
  }
};

/**
 * Initialize all schedulers
 */
const initializeSchedulers = () => {
  scheduleTaskReminders();
  scheduleOverdueCheck();
  console.log('📅 All schedulers initialized successfully');
};

module.exports = {
  initializeSchedulers,
  checkRemindersNow,
  scheduleTaskReminders,
  scheduleOverdueCheck
};