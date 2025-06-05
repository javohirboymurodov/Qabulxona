const mongoose = require('mongoose');

// O'zbekiston vaqt zonasi (+5)
const UZB_TIMEZONE_OFFSET = 5;

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
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    },
    timeUpdated: {
      type: Date,
      required: true
    }
  }],
  totalPresent: {
    type: Number,
    default: 0
  },
  totalAbsent: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Virtual field uchun O'zbekiston vaqti
receptionHistorySchema.virtual('uzbekistanDate').get(function() {
  const date = new Date(this.date);
  return new Date(date.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
});

// toJSON va toObject metodlarini override qilish
receptionHistorySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Asosiy sana
    if (ret.date) {
      const date = new Date(ret.date);
      ret.date = new Date(date.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    
    // Xodimlar uchun timeUpdated
    if (ret.employees) {
      ret.employees = ret.employees.map(emp => ({
        ...emp,
        timeUpdated: emp.timeUpdated ? 
          new Date(emp.timeUpdated.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000) : 
          undefined
      }));
    }
    
    // createdAt va updatedAt
    if (ret.createdAt) {
      const createdAt = new Date(ret.createdAt);
      ret.createdAt = new Date(createdAt.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    if (ret.updatedAt) {
      const updatedAt = new Date(ret.updatedAt);
      ret.updatedAt = new Date(updatedAt.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    return ret;
  }
});

receptionHistorySchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    // Asosiy sana
    if (ret.date) {
      const date = new Date(ret.date);
      ret.date = new Date(date.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    
    // Xodimlar uchun timeUpdated
    if (ret.employees) {
      ret.employees = ret.employees.map(emp => ({
        ...emp,
        timeUpdated: emp.timeUpdated ? 
          new Date(emp.timeUpdated.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000) : 
          undefined
      }));
    }
    
    // createdAt va updatedAt
    if (ret.createdAt) {
      const createdAt = new Date(ret.createdAt);
      ret.createdAt = new Date(createdAt.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    if (ret.updatedAt) {
      const updatedAt = new Date(ret.updatedAt);
      ret.updatedAt = new Date(updatedAt.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    return ret;
  }
});

// Create index for date to optimize queries
receptionHistorySchema.index({ date: 1 });

module.exports = mongoose.model('ReceptionHistory', receptionHistorySchema);
