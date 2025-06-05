const mongoose = require('mongoose');

// O'zbekiston vaqt zonasi (+5)
const UZB_TIMEZONE_OFFSET = 5;

const meetingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  createdAt: { type: Date, default: Date.now }
});

// Virtual field uchun O'zbekiston vaqti
meetingSchema.virtual('uzbekistanDate').get(function() {
  const date = new Date(this.date);
  return new Date(date.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
});

// toJSON va toObject metodlarini override qilish
meetingSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.date) {
      const date = new Date(ret.date);
      ret.date = new Date(date.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    if (ret.createdAt) {
      const createdAt = new Date(ret.createdAt);
      ret.createdAt = new Date(createdAt.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    return ret;
  }
});

meetingSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.date) {
      const date = new Date(ret.date);
      ret.date = new Date(date.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    if (ret.createdAt) {
      const createdAt = new Date(ret.createdAt);
      ret.createdAt = new Date(createdAt.getTime() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
    }
    return ret;
  }
});

module.exports = mongoose.model('Meeting', meetingSchema);