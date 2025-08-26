const mongoose = require("mongoose");

// Task history schema
const taskHistorySchema = new mongoose.Schema({
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: String, required: true }, // Admin nomi
  completedAt: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, { timestamps: true });

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    experience: { type: Number, required: true }, // staj in years
    biography: { type: String }, // qo'shimcha ma'lumot
    objectivePath: { type: String }, // obektivka file path
    dateOfBirth: { type: Date },
    education: { type: String },
    joinedDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['waiting', 'present', 'absent'],
      default: 'waiting'
    },
    task: {
      description: String,
      deadline: Number,
      assignedAt: Date
    },
    // Telegram integration fields
    telegramId: { 
      type: String, 
      unique: true, 
      sparse: true // Allows null values to be non-unique
    },
    telegramPhone: { type: String }, // Telegram'dan kelgan telefon raqam
    isVerified: { type: Boolean, default: false }, // Telegram orqali tasdiqlangan
    
    // Task history
    taskHistory: [taskHistorySchema],
    
    // Notification settings
    notificationSettings: {
      receptionNotification: { type: Boolean, default: true },
      meetingNotification: { type: Boolean, default: true },
      taskNotification: { type: Boolean, default: true },
      reminderNotification: { type: Boolean, default: true }
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for active tasks count
employeeSchema.virtual('activeTasks').get(function() {
  if (!this.taskHistory || !Array.isArray(this.taskHistory)) {
    return 0;
  }
  return this.taskHistory.filter(task => task.status === 'pending').length;
});

// Virtual for completed tasks count
employeeSchema.virtual('completedTasks').get(function() {
  if (!this.taskHistory || !Array.isArray(this.taskHistory)) {
    return 0;
  }
  return this.taskHistory.filter(task => task.status === 'completed').length;
});

// Method to add task to history
employeeSchema.methods.addTask = function(taskData) {
  if (!this.taskHistory) {
    this.taskHistory = [];
  }
  this.taskHistory.push(taskData);
  return this.save();
};

// Method to update task status
employeeSchema.methods.updateTaskStatus = function(taskId, status, completedAt = null) {
  if (!this.taskHistory || !Array.isArray(this.taskHistory)) {
    return null;
  }
  const task = this.taskHistory.id(taskId);
  if (task) {
    task.status = status;
    if (completedAt) task.completedAt = completedAt;
    return this.save();
  }
  return null;
};

// Static method to find by telegram phone
employeeSchema.statics.findByTelegramPhone = function(phone) {
  // Remove +998 prefix and spaces for comparison
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  const phoneVariants = [
    phone,
    `+998${cleanPhone.slice(-9)}`, // Add +998 prefix
    cleanPhone.slice(-9), // Last 9 digits only
    `998${cleanPhone.slice(-9)}` // 998 prefix
  ];
  
  return this.findOne({
    $or: phoneVariants.map(variant => ({
      phone: { $regex: variant.replace(/[\+\(\)\-\s]/g, ''), $options: 'i' }
    }))
  });
};

module.exports = mongoose.model("Employee", employeeSchema);
