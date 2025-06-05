const multer = require('multer');

// Xatoliklarni qayta ishlash uchun middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      message: 'Fayl yuklashda xatolik yuz berdi'
    });
  }
  
  res.status(500).json({ 
    message: err.message || 'Serverda kutilmagan xatolik yuz berdi'
  });
};

module.exports = errorHandler;
