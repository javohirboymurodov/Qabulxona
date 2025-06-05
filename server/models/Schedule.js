const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, { 
  timestamps: true,
  _id: true // Enable _id for subdocuments
});

const scheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  tasks: [taskSchema]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Schedule', scheduleSchema);