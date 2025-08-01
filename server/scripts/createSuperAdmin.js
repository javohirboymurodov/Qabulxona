const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  try {
    // MongoDB URI ni tekshirish
    console.log('Trying to connect with URI:', process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI topilmadi. .env faylini tekshiring!');
    }

    // MongoDB ga ulanish
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB ga muvaffaqiyatli ulandi');


    // Super Admin yaratish
    const superAdmin = await Admin.findOneAndUpdate(
      { username: 'superadmin' },
      {
        username: 'superadmin',
        password: await bcrypt.hash('123', 12),
        fullName: 'Super Administrator',
        role: 'super_admin',
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log('Super Admin yaratildi:');
    console.log('Username:', superAdmin.username);
    console.log('Password: 123');

  } catch (error) {
    console.error('Xatolik yuz berdi:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB aloqasi uzildi');
    }
    process.exit();
  }
}

createSuperAdmin();