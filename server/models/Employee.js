const mongoose = require("mongoose");

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
      enum: ['present', 'absent', 'waiting', 'none'],
      default: 'none'
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("Employee", employeeSchema);
