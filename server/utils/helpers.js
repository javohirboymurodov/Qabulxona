const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');

// PDF faylni o'chirish uchun utility funksiya
exports.deletePDFFile = async (filename) => {
  try {
    if (!filename) return false;
    
    const filePath = path.join(__dirname, '..', 'uploadObektivka', filename);
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('PDF faylni o\'chirishda xatolik:', error);
    return false;
  }
};

// Sana formatlash uchun utility funksiya
exports.formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

// Xodim ma'lumotlarini validatsiya qilish
exports.validateEmployee = (employeeData) => {
  const errors = [];

  if (!employeeData.name) {
    errors.push('F.I.O kiritilishi shart');
  }

  if (!employeeData.position) {
    errors.push('Lavozim kiritilishi shart');
  }

  if (!employeeData.department) {
    errors.push('Bo\'lim kiritilishi shart');
  }

  if (!employeeData.phone) {
    errors.push('Telefon raqami kiritilishi shart');
  }

  // Telefon raqami formati tekshiruvi
  const phoneRegex = /^\+998[0-9]{9}$/;
  if (employeeData.phone && !phoneRegex.test(employeeData.phone)) {
    errors.push('Telefon raqami noto\'g\'ri formatda (+998XXXXXXXXX)');
  }

  if (typeof employeeData.experience !== 'undefined') {
    const experience = Number(employeeData.experience);
    if (isNaN(experience) || experience < 0) {
      errors.push('Ish staji noto\'g\'ri formatda');
    }
  }

  // Sanalar tekshiruvi
  if (employeeData.dateOfBirth) {
    const birthDate = new Date(employeeData.dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      errors.push('Tug\'ilgan sana noto\'g\'ri formatda');
    }
  }

  if (employeeData.joinedDate) {
    const joinedDate = new Date(employeeData.joinedDate);
    if (isNaN(joinedDate.getTime())) {
      errors.push('Ishga kirgan sana noto\'g\'ri formatda');
    }
  }

  return errors;
};

// Xodim holatini tekshirish
exports.validateEmployeeStatus = (status) => {
  const validStatuses = ['present', 'absent', 'waiting', 'none'];
  return validStatuses.includes(status);
};

// Response qaytarish uchun yordamchi funksiya
exports.sendResponse = (res, statusCode, data, message = '') => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    data: data,
    message: message
  };
  return res.status(statusCode).json(response);
};

// Xatolikni qayta ishlash uchun yordamchi funksiya
exports.handleError = (error) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: error.message
    };
  }
  
  if (error.name === 'CastError') {
    return {
      statusCode: 404,
      message: 'Ma\'lumot topilmadi'
    };
  }
  
  return {
    statusCode: 500,
    message: 'Serverda xatolik yuz berdi'
  };
};
