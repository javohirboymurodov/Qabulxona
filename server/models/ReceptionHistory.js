const mongoose = require('mongoose');

const receptionHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  employees: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    name: String,
    position: String,
    department: String,
    phone: String,
    status: {
      type: String,
      enum: ['waiting', 'present', 'absent'],
      default: 'waiting'
    },
    // Vaqt field'lari aniq ajratildi
    scheduledTime: String,  // "14:30" - qabul belgilangan vaqti (simple)
    arrivedAt: Date,        // Xodim kelgan aniq vaqt (timestamp)
    statusUpdatedAt: Date,  // Status yangilangan vaqt
    task: {
      description: String,
      deadline: Number, // Kun hisobida
      assignedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'overdue'],
        default: 'pending'
      }
    },
    // Deprecated fields (migration uchun)
    timeUpdated: {
      type: Date,
      default: Date.now
    },
    createdAt: { type: Date, default: Date.now },
  }]
}, { 
  timestamps: true,
  collection: 'receptionhistories' // Collection nomini aniq belgilash
});

// Kunlik qabullarni olish uchun static method
receptionHistorySchema.statics.getByDate = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate('employees.employeeId', 'name position department');
};

// Date range bo'yicha olish
receptionHistorySchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).populate('employees.employeeId', 'name position department')
    .sort({ date: -1 });
};

// Index qo'shish (performance uchun)
receptionHistorySchema.index({ date: 1 });
receptionHistorySchema.index({ 'employees.employeeId': 1 });

module.exports = mongoose.model('ReceptionHistory', receptionHistorySchema);
