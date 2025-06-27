const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin']
  },
  permissions: [{
    type: String,
    enum: [
      'manage_admins',
      'manage_meetings',
      'manage_employees',
      'manage_schedule',
      'view_all'
    ]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);