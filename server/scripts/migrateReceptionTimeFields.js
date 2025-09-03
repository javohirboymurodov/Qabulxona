const mongoose = require('mongoose');
const dayjs = require('dayjs');
require('dotenv').config();

// MongoDB ulanishi
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qabulxona';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Reception time fields migration
const migrateReceptionTimeFields = async () => {
  try {
    console.log('🔄 Starting reception time fields migration...');
    
    // ReceptionHistory collection'ni olish
    const ReceptionHistory = mongoose.model('ReceptionHistory', new mongoose.Schema({}, { strict: false }));
    
    // Barcha reception history'larni olish
    const receptions = await ReceptionHistory.find({});
    console.log(`📊 Found ${receptions.length} reception records`);
    
    let updatedCount = 0;
    
    for (const reception of receptions) {
      let hasChanges = false;
      
      // Har bir employee uchun
      for (const employee of reception.employees) {
        // scheduledTime ni qo'shish (agar yo'q bo'lsa)
        if (!employee.scheduledTime) {
          if (employee.timeUpdated) {
            // timeUpdated'dan vaqtni extract qilish
            employee.scheduledTime = dayjs(employee.timeUpdated).format('HH:mm');
          } else {
            // Default qabul vaqti
            employee.scheduledTime = '09:00';
          }
          hasChanges = true;
        }
        
        // statusUpdatedAt ni qo'shish
        if (!employee.statusUpdatedAt) {
          employee.statusUpdatedAt = employee.timeUpdated || employee.createdAt || new Date();
          hasChanges = true;
        }
        
        // arrivedAt ni qo'shish (agar status 'present' bo'lsa)
        if (employee.status === 'present' && !employee.arrivedAt) {
          employee.arrivedAt = employee.timeUpdated || employee.createdAt || new Date();
          hasChanges = true;
        }
      }
      
      // Agar o'zgarish bo'lsa, saqlash
      if (hasChanges) {
        await reception.save();
        updatedCount++;
        console.log(`✅ Updated reception for date: ${dayjs(reception.date).format('YYYY-MM-DD')}`);
      }
    }
    
    console.log(`🎯 Migration completed! Updated ${updatedCount} reception records`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Main function
const runMigration = async () => {
  try {
    await connectDB();
    await migrateReceptionTimeFields();
    console.log('🎊 Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
runMigration();