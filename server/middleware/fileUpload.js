const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploadObektivka');
    // Papka mavjud bo'lmasa yaratish
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },  filename: function (req, file, cb) {
    // Remove special characters and spaces from original filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Faqat PDF fayl yuklash mumkin!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

module.exports = { upload };
