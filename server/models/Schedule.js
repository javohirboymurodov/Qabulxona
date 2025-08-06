const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { 
  timestamps: true,
  _id: true
});

const scheduleSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true 
  },
  tasks: [taskSchema],
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true 
});

// Index for better performance
scheduleSchema.index({ date: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);