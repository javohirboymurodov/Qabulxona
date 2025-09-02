# 🏢 ҚАБУЛХОНА ТИЗИМИ - Loyiha Arxitekturasi

## 📋 **LOYIHA HAQIDA**
**Maqsad:** Rahbarlar uchun ish grafigi, qabullar va majlislarni avtomatlashtirish tizimi
**Texnologiyalar:** Node.js + Express + MongoDB + React + Ant Design + Telegram Bot
**Joriy holat:** Bitta boss uchun mo'ljallangan
**Maqsadli holat:** Multi-boss/Multi-admin tizimi

---

## 🗂️ **LOYIHA STRUKTURASI**

```
📁 /workspace/
├── 📁 server/                          # Backend (Node.js + Express)
│   ├── 📁 assets/                      # Static fayllar
│   │   ├── 📁 fonts/                   # PDF uchun shriftlar
│   │   └── 📁 images/                  # Logo va rasmlar
│   ├── 📁 config/                      # Konfiguratsiya
│   │   └── 📄 db.js                    # MongoDB ulanishi
│   ├── 📁 controllers/                 # API Controller'lar
│   │   ├── 📄 adminController.js       # Admin CRUD
│   │   ├── 📄 authController.js        # Login/Logout/Token
│   │   ├── 📄 employeeController.js    # Xodimlar boshqaruvi
│   │   ├── 📄 meetingController.js     # Majlislar boshqaruvi
│   │   ├── 📄 receptionHistoryController.js # Qabullar tarixi
│   │   └── 📄 scheduleController.js    # Ish grafigi
│   ├── 📁 middleware/                  # Middleware'lar
│   │   ├── 📄 auth.js                  # JWT autentifikatsiya
│   │   ├── 📄 dateCheck.js             # Sana tekshiruvi
│   │   ├── 📄 errorHandler.js          # Xatoliklar boshqaruvi
│   │   └── 📄 fileUpload.js            # Fayl yuklash
│   ├── 📁 models/                      # MongoDB modellari
│   │   ├── 📄 Admin.js                 # Admin modeli
│   │   ├── 📄 Employee.js              # Xodim modeli
│   │   ├── 📄 Meeting.js               # Majlis modeli
│   │   ├── 📄 ReceptionHistory.js      # Qabul tarixi
│   │   └── 📄 Schedule.js              # Ish grafigi
│   ├── 📁 routes/                      # API Route'lar
│   │   ├── 📄 admin.js                 # Admin API
│   │   ├── 📄 auth.js                  # Auth API
│   │   ├── 📄 employees.js             # Xodimlar API
│   │   ├── 📄 meetings.js              # Majlislar API
│   │   ├── 📄 receptionHistory.js      # Qabullar API
│   │   └── 📄 schedule.js              # Ish grafigi API
│   ├── 📁 services/                    # Biznes logika
│   │   ├── 📄 pdfService.js            # PDF generatsiya
│   │   └── 📄 employeeService.js       # Xodimlar xizmati
│   ├── 📁 scripts/                     # Utility scriptlar
│   │   └── 📄 createSuperAdmin.js      # Super admin yaratish
│   ├── 📁 telegram/                    # Telegram bot
│   │   ├── 📄 bot.js                   # Asosiy bot logikasi
│   │   ├── 📁 services/                # Bot xizmatlari
│   │   └── 📁 scheduler/               # Eslatma xizmati
│   ├── 📁 utils/                       # Yordamchi funksiyalar
│   │   ├── 📄 helpers.js               # Umumiy helper'lar
│   │   └── 📄 scheduler.js             # Vaqt boshqaruvi
│   ├── 📄 server.js                    # Asosiy server fayli
│   └── 📄 package.json                 # Dependencies
├── 📁 client/                          # Frontend (React + Ant Design)
│   ├── 📁 src/
│   │   ├── 📁 components/              # React komponentlar
│   │   │   ├── 📁 Admins/              # Admin boshqaruv
│   │   │   ├── 📁 BossWorkSchedule/    # Rahbar ish grafigi
│   │   │   ├── 📁 Employees/           # Xodimlar boshqaruvi
│   │   │   ├── 📁 Meetings/            # Majlislar
│   │   │   ├── 📁 Reseption/           # Qabullar
│   │   │   ├── 📄 HomePage.jsx         # Asosiy sahifa
│   │   │   ├── 📄 Login.jsx            # Login sahifasi
│   │   │   └── 📄 Navbar.jsx           # Navigatsiya
│   │   ├── 📁 services/                # API xizmatlari
│   │   │   └── 📄 api.js               # API so'rovlar
│   │   ├── 📁 utils/                   # Utility'lar
│   │   │   └── 📄 pdfGenerator.js      # PDF generatsiya
│   │   ├── 📄 App.jsx                  # Asosiy App komponenti
│   │   └── 📄 main.jsx                 # Entry point
│   ├── 📄 index.html                   # HTML shablon
│   ├── 📄 package.json                 # Dependencies
│   └── 📄 vite.config.mjs              # Vite konfiguratsiya
└── 📄 .gitignore                       # Git ignore
```

---

## 🔧 **JORIY TIZIM IMKONIYATLARI**

### 🔐 **Autentifikatsiya va Avtorizatsiya**
- **JWT Token** autentifikatsiya
- **Rol tizimi:** `super_admin`, `admin`
- **Token refresh** mexanizmi
- **Parol o'zgartirish** imkoniyati
- **Session boshqaruvi**

### 👥 **Foydalanuvchi Rollari**
```javascript
// Joriy rollar
{
  super_admin: {
    permissions: [
      'create_admin', 'edit_admin', 'delete_admin', 'view_all_data',
      'manage_employees', 'manage_meetings', 'manage_schedule', 
      'manage_receptions', 'generate_pdf', 'telegram_settings'
    ]
  },
  admin: {
    permissions: [
      'manage_employees', 'manage_meetings', 'manage_schedule',
      'manage_receptions', 'generate_pdf', 'view_own_data'
    ]
  }
}
```

### 📊 **Ma'lumotlar Bazasi Modellari**

#### 1. **Admin Model** (`server/models/Admin.js`)
```javascript
{
  username: String (unique),
  password: String (hashed),
  fullName: String,
  role: Enum['super_admin', 'admin'],
  createdBy: ObjectId,
  isActive: Boolean,
  lastLogin: Date,
  timestamps: true
}
```

#### 2. **Employee Model** (`server/models/Employee.js`)
```javascript
{
  name: String,
  position: String,
  phone: String (unique),
  department: String,
  experience: Number,
  biography: String,
  dateOfBirth: Date,
  education: String,
  joinedDate: Date,
  status: Enum['waiting', 'present', 'absent'],
  
  // Telegram integration
  telegramId: String,
  telegramPhone: String,
  isVerified: Boolean,
  
  // Task history
  taskHistory: [{
    description: String,
    deadline: Date,
    assignedAt: Date,
    assignedBy: String,
    completedAt: Date,
    status: Enum['pending', 'completed', 'overdue'],
    priority: Enum['low', 'normal', 'high', 'urgent']
  }],
  
  // Reception history
  receptionHistory: [{
    receptionId: ObjectId,
    date: Date,
    time: String,
    status: Enum['waiting', 'present', 'absent'],
    notes: String,
    attendedAt: Date
  }],
  
  // Meeting history
  meetingHistory: [{
    meetingId: ObjectId,
    status: Enum['invited', 'attended', 'missed'],
    joinedAt: Date,
    attendedAt: Date,
    notes: String
  }],
  
  // Notification settings
  notificationSettings: {
    receptionNotification: Boolean,
    meetingNotification: Boolean,
    taskNotification: Boolean,
    reminderNotification: Boolean
  }
}
```

#### 3. **Schedule Model** (`server/models/Schedule.js`)
```javascript
{
  date: Date,
  tasks: [{
    title: String,
    description: String,
    startTime: String, // HH:MM format
    endTime: String,   // HH:MM format
    priority: Enum['low', 'normal', 'high', 'urgent'],
    status: Enum['pending', 'in-progress', 'completed', 'cancelled']
  }],
  notes: String,
  timestamps: true
}
```

#### 4. **Meeting Model** (`server/models/Meeting.js`)
```javascript
{
  name: String,
  description: String,
  date: Date,
  time: String,
  location: String,
  participants: [ObjectId], // Employee references
  createdAt: Date
}
```

#### 5. **ReceptionHistory Model** (`server/models/ReceptionHistory.js`)
```javascript
{
  date: Date,
  employees: [{
    employeeId: ObjectId,
    name: String,
    position: String,
    department: String,
    phone: String,
    status: Enum['waiting', 'present', 'absent'],
    task: {
      description: String,
      deadline: Number,
      assignedAt: Date,
      status: Enum['pending', 'completed', 'overdue']
    },
    timeUpdated: Date,
    createdAt: Date
  }]
}
```

### 🌐 **API Endpoint'lar**

#### **Auth API** (`/api/auth/`)
- `POST /login` - Tizimga kirish
- `POST /refresh` - Token yangilash
- `GET /me` - Joriy foydalanuvchi ma'lumoti
- `POST /logout` - Tizimdan chiqish
- `PUT /change-password` - Parol o'zgartirish

#### **Admin API** (`/api/admin/`)
- `GET /` - Barcha adminlar (super_admin uchun)
- `POST /` - Yangi admin yaratish (super_admin uchun)
- `PUT /:id` - Admin yangilash (super_admin uchun)
- `DELETE /:id` - Admin o'chirish (super_admin uchun)

#### **Employee API** (`/api/employees/`)
- `GET /` - Barcha xodimlar
- `POST /` - Yangi xodim qo'shish
- `GET /:id` - Xodim ma'lumotlari
- `PUT /:id` - Xodim yangilash
- `DELETE /:id` - Xodim o'chirish
- `POST /:id/task` - Xodimga vazifa berish

#### **Schedule API** (`/api/schedule/`)
- `GET /:date` - Kunlik ish grafigi
- `POST /` - Ish grafigi yaratish
- `PUT /:date` - Ish grafigi yangilash
- `GET /daily-plan/:date` - Birlashtirilgan kunlik reja
- `POST /daily-plan` - Kunlik reja saqlash
- `GET /pdf/:date` - PDF generatsiya

#### **Meeting API** (`/api/meetings/`)
- `GET /` - Barcha majlislar
- `POST /` - Yangi majlis yaratish
- `GET /:id` - Majlis ma'lumotlari
- `PUT /:id` - Majlis yangilash
- `DELETE /:id` - Majlis o'chirish

#### **Reception API** (`/api/reception-history/`)
- `GET /` - Qabullar tarixi
- `POST /` - Yangi qabul yaratish
- `GET /:date` - Kunlik qabullar
- `PUT /:id/status` - Qabul holati yangilash

### 🤖 **Telegram Bot Imkoniyatlari**
- **Xodim ro'yxatdan o'tish** - Telefon raqam orqali
- **Qabul eslatmalari** - Avtomatik bildirishnomalar
- **Majlis eslatmalari** - Ishtirokchilarga xabar
- **Vazifa eslatmalari** - Deadline yaqinlashganda
- **Status yangilanishi** - Real-time holat o'zgarishi

### 🎨 **Frontend Komponentlari**

#### **Asosiy Komponentlar:**
- `App.jsx` - Asosiy app va routing
- `Login.jsx` - Kirish sahifasi
- `HomePage.jsx` - Dashboard
- `Navbar.jsx` - Navigatsiya (role-based)

#### **Admin Boshqaruv:**
- `AdminManager.jsx` - Admin ro'yxati va boshqaruv
- `AddAdminModal.jsx` - Yangi admin qo'shish

#### **Rahbar Ish Grafigi:**
- `BossWorkSchedule.jsx` - Asosiy ish grafigi komponenti
- `DailyPlanModal.jsx` - Kunlik reja tahrirlash

#### **Xodimlar:**
- `EmployeeList.jsx` - Xodimlar ro'yxati
- `AddEmployeeModal.jsx` - Yangi xodim qo'shish
- `EmployeeDetails.jsx` - Xodim tafsilotlari

#### **Majlislar:**
- `MeetingList.jsx` - Majlislar ro'yxati
- `AddMeetingModal.jsx` - Yangi majlis

#### **Qabullar:**
- `BossReception.jsx` - Qabullar boshqaruvi
- `ReceptionHistory.jsx` - Qabullar tarixi

### 📄 **PDF Generatsiya Tizimi**
- **Server-side:** PDFKit kutubxonasi
- **Uzbek Cyrillic** qo'llab-quvvatlash
- **Professional format** - jadval, logo, imzo
- **Multi-page support**
- **Custom fonts** (DejaVu Sans)

---

## 🎯 **MULTI-BOSS TIZIMI TALABLARI**

### 📝 **Yangi Talablar:**
1. **Har admin bitta bossni boshqaradi**
2. **Adminlar bir-birining ma'lumotlarini ko'rmaydi**
3. **Super admin barcha adminlar va bosslarni ko'radi**
4. **Bitta tashkilot** (Organization model kerak emas)
5. **Data isolation** admin darajasida

---

## 🔄 **MULTI-BOSS UCHUN KERAKLI O'ZGARISHLAR**

### 1. **🆕 YANGI MODELLAR**

#### **Boss Model** (`server/models/Boss.js`)
```javascript
{
  name: String,                    // Boss ismi
  position: String,               // Lavozimi
  department: String,             // Bo'limi
  phone: String,                  // Telefon
  email: String,                  // Email
  isActive: Boolean,              // Faol holat
  createdBy: ObjectId,            // Qaysi super admin yaratgan
  assignedAdmin: ObjectId,        // Biriktirilgan admin
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **📝 MAVJUD MODELLARNI YANGILASH**

#### **Admin Model o'zgarishlari:**
```javascript
// Qo'shilishi kerak:
{
  assignedBoss: ObjectId,         // Biriktirilgan boss
  canManageMultipleBosses: Boolean, // Kelajakda
}
```

#### **Schedule Model o'zgarishlari:**
```javascript
// Qo'shilishi kerak:
{
  bossId: ObjectId,              // Qaysi boss uchun
  createdBy: ObjectId,           // Qaysi admin yaratgan
}
```

#### **Meeting Model o'zgarishlari:**
```javascript
// Qo'shilishi kerak:
{
  bossId: ObjectId,              // Qaysi boss uchun
  createdBy: ObjectId,           // Qaysi admin yaratgan
}
```

#### **ReceptionHistory Model o'zgarishlari:**
```javascript
// Qo'shilishi kerak:
{
  bossId: ObjectId,              // Qaysi boss uchun
  createdBy: ObjectId,           // Qaysi admin yaratgan
}
```

### 3. **🔒 YANGI MIDDLEWARE**

#### **Data Isolation Middleware** (`server/middleware/dataIsolation.js`)
```javascript
// Adminlar faqat o'z bossining ma'lumotlarini ko'radi
const isolateByBoss = async (req, res, next) => {
  if (req.admin.role === 'super_admin') {
    // Super admin barcha ma'lumotlarni ko'radi
    return next();
  }
  
  // Admin faqat o'z bossining ma'lumotlarini ko'radi
  req.bossFilter = { bossId: req.admin.assignedBoss };
  next();
};
```

### 4. **🌐 API O'ZGARISHLARI**

#### **Yangi Boss API** (`/api/bosses/`)
- `GET /` - Bosslar ro'yxati (super_admin uchun)
- `POST /` - Yangi boss yaratish (super_admin uchun)
- `GET /:id` - Boss ma'lumotlari
- `PUT /:id` - Boss yangilash
- `DELETE /:id` - Boss o'chirish

#### **Mavjud API'lar o'zgarishi:**
- Barcha GET so'rovlarga `bossId` filter qo'shish
- Barcha POST so'rovlarga `bossId` qo'shish
- Data isolation middleware qo'llash

### 5. **🖥️ FRONTEND O'ZGARISHLARI**

#### **Yangi Komponentlar:**
- `BossManager.jsx` - Boss boshqaruvi (super_admin uchun)
- `BossSelector.jsx` - Boss tanlash (admin uchun)
- `AddBossModal.jsx` - Yangi boss qo'shish

#### **Mavjud Komponentlar o'zgarishi:**
- `App.jsx` - Boss context qo'shish
- `Navbar.jsx` - Boss ma'lumotini ko'rsatish
- Barcha CRUD komponentlarga boss filter

---

## 📋 **AMALGA OSHIRISH REJASI**

### **1-BOSQICH: Database va Backend (2-3 hafta)**

#### **1.1 Boss Model yaratish**
```bash
# Fayllar:
- server/models/Boss.js
- server/controllers/bossController.js
- server/routes/bosses.js
```

#### **1.2 Mavjud modellarni yangilash**
```bash
# O'zgartirilishi kerak:
- server/models/Admin.js (assignedBoss field)
- server/models/Schedule.js (bossId field)
- server/models/Meeting.js (bossId field)
- server/models/ReceptionHistory.js (bossId field)
```

#### **1.3 Data Isolation Middleware**
```bash
# Yangi fayllar:
- server/middleware/dataIsolation.js
- server/middleware/bossAccess.js
```

#### **1.4 API'larni yangilash**
```bash
# O'zgartirilishi kerak:
- server/controllers/scheduleController.js
- server/controllers/meetingController.js
- server/controllers/receptionHistoryController.js
- server/routes/ (barcha route'lar)
```

### **2-BOSQICH: Migration va Data (1-2 hafta)**

#### **2.1 Migration Script**
```bash
# Yangi fayllar:
- server/scripts/migrateToBossSystem.js
- server/scripts/createDefaultBoss.js
```

#### **2.2 Mavjud ma'lumotlarni o'tkazish**
- Default boss yaratish
- Barcha schedule, meeting, reception'larga bossId qo'shish
- Admin'larga assignedBoss qo'shish

### **3-BOSQICH: Frontend (2-3 hafta)**

#### **3.1 Boss Management**
```bash
# Yangi komponentlar:
- client/src/components/Bosses/BossManager.jsx
- client/src/components/Bosses/AddBossModal.jsx
- client/src/components/Bosses/BossSelector.jsx
```

#### **3.2 Context va State Management**
```bash
# O'zgartirilishi kerak:
- client/src/App.jsx (Boss context)
- client/src/services/api.js (Boss API'lar)
```

#### **3.3 Mavjud komponentlarni yangilash**
```bash
# O'zgartirilishi kerak:
- client/src/components/BossWorkSchedule/
- client/src/components/Meetings/
- client/src/components/Reseption/
- client/src/components/Navbar.jsx
```

### **4-BOSQICH: Testing va Optimization (1 hafta)**
- Unit testlar
- Integration testlar
- Performance optimization
- Bug fixing

---

## 📊 **MURAKKABLIK BAHOLASH**

### **🟢 OSON QISMLAR (20%):**
- Boss model yaratish
- Admin modeliga field qo'shish
- Basic UI komponentlar

### **🟡 O'RTACHA QISMLAR (50%):**
- Data isolation middleware
- API'larni yangilash
- Frontend context management
- Migration scriptlar

### **🔴 QIYIN QISMLAR (30%):**
- Mavjud ma'lumotlarni migration qilish
- Barcha komponentlarda data filtering
- Testing va debugging
- PDF service'ni boss-specific qilish

## 🎯 **UMUMIY MURAKKABLIK: 60-70%**

### **Vaqt baholash:**
- **To'liq implementatsiya:** 6-8 hafta
- **MVP versiya:** 4-5 hafta

### **Risk'lar:**
- Ma'lumotlar yo'qolish xavfi (migration)
- Mavjud funksionallik buzilishi
- Performance muammolari

### **Tavsiyalar:**
1. **Backup** olish har bosqichda
2. **Bosqichma-bosqich** amalga oshirish
3. **Testing** har bosqichda
4. **Rollback plan** tayyorlash

---

## 🔧 **DEVELOPMENT ENVIRONMENT**

### **Backend Requirements:**
- Node.js 18+
- MongoDB 5.0+
- Express.js 4.18+
- JWT authentication
- PDFKit for PDF generation

### **Frontend Requirements:**
- React 18+
- Ant Design 5.26+
- Vite build tool
- Axios for API calls
- Day.js for date handling

### **Additional Services:**
- Telegram Bot API
- File upload system
- PDF generation service
- Notification system

---

## 🚀 **XULOSA**

**Imkoniyat:** ✅ **Mavjud**
**Murakkablik:** 🟡 **60-70%**
**Vaqt:** ⏰ **6-8 hafta**
**Tavsiya:** 🎯 **Bosqichma-bosqich amalga oshirish**

Loyiha yaxshi strukturalangan va multi-boss tizimiga o'tkazish **mumkin**, lekin **o'rtacha murakkablik** talab qiladi. Asosiy qiyinchilik - mavjud ma'lumotlarni yangi arxitekturaga migration qilish va data isolation ta'minlash.

**Keyingi qadam:** Qaysi bosqichdan boshlashni xohlaysiz?