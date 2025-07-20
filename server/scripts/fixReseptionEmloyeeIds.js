const mongoose = require('mongoose');
const ReceptionHistory = require('../models/ReceptionHistory');

async function fixEmployeeIds() {
  await mongoose.connect('mongodb://localhost:27017/qabulxona'); // DB nomini moslang

  const receptions = await ReceptionHistory.find({});
  for (const reception of receptions) {
    let changed = false;
    reception.employees = reception.employees.map(emp => {
      if (!emp.employeeId && (emp._id || emp.id)) {
        changed = true;
        return {
          ...emp,
          employeeId: emp._id ? emp._id.toString() : emp.id ? emp.id.toString() : undefined
        };
      }
      return emp;
    });
    if (changed) {
      await reception.save();
      console.log('Fixed:', reception._id);
    }
  }
  console.log('Done!');
  process.exit();
}

fixEmployeeIds();
