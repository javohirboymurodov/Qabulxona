# 🤖 Qabulxona Telegram Bot Setup Guide

Bu guide Qabulxona loyihasiga Telegram bot integratsiyasini o'rnatish uchun.

## 📋 Prerequisites

- Node.js 16+ o'rnatilgan bo'lishi kerak
- MongoDB ishlab turishi kerak
- Qabulxona backend serveri ishlayotgan bo'lishi kerak

## 🔧 1. Telegram Bot Yaratish

### 1.1 BotFather bilan bot yaratish

1. Telegram'da [@BotFather](https://t.me/botfather) botini toping
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: "Qabulxona Bot")
4. Bot username'ini kiriting (masalan: "qabulxona_company_bot")
5. BotFather sizga bot token beradi (masalan: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)

### 1.2 Bot sozlamalari

```
/setdescription - Bot haqida ma'lumot
/setabouttext - Bot qisqacha tavsifi
/setuserpic - Bot avatari
```

## ⚙️ 2. Environment Configuration

### 2.1 Server .env faylini yangilash

`server/.env` faylini yarating yoki mavjudini yangilang:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/qabulxona

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ

# Optional: Admin Telegram ID
ADMIN_TELEGRAM_ID=123456789
```

### 2.2 Dependencies o'rnatish

```bash
cd server
npm install node-telegram-bot-api node-cron
```

## 🚀 3. Bot ishga tushirish

### 3.1 Alohida process sifatida

```bash
cd server
npm run bot
```

### 3.2 Development rejimida

```bash
cd server
npm run dev:bot
```

### 3.3 Main server bilan birga

```bash
cd server
npm run dev
# Boshqa terminalda:
npm run bot
```

## 📱 4. Xodimlarni ro'yxatdan o'tkazish

### 4.1 Xodim ma'lumotlarini tayyorlash

Avval xodimlarni tizimda ro'yxatdan o'tkazish kerak:

1. Admin panel orqali xodim qo'shing
2. Telefon raqamini to'g'ri formatda kiriting: `+998901234567`
3. Xodimga bot username'ini yuboring

### 4.2 Xodim bot bilan ro'yxatdan o'tishi

1. Xodim botni topadi va `/start` bosadi
2. Bot telefon raqam so'raydi
3. Xodim "📱 Telefon raqamni yuborish" tugmasini bosadi
4. Telegram avtomatik telefon raqamni yuboradi
5. Bot xodimni tanib oladi va ro'yxatdan o'tkazadi

## 📬 5. Notification Test

### 5.1 Reception notification test

```bash
# API orqali xodimni qabulga qo'shish
curl -X POST http://localhost:5000/api/reception-history/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "status": "waiting"
  }'
```

### 5.2 Meeting notification test

```bash
# API orqali majlis yaratish
curl -X POST http://localhost:5000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Meeting",
    "date": "2024-01-20",
    "time": "10:00",
    "participants": ["EMPLOYEE_ID"]
  }'
```

### 5.3 Task notification test

```bash
# API orqali topshiriq berish
curl -X POST http://localhost:5000/api/employees/EMPLOYEE_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Test topshiriq",
    "deadline": "2024-01-25",
    "priority": "normal"
  }'
```

## 🔔 6. Reminder System

### 6.1 Avtomatik eslatmalar

- **Har kuni 9:00** - ertaga tugaydigan topshiriqlar uchun eslatma
- **Har kuni 22:00** - muddati o'tgan topshiriqlarni "overdue" deb belgilash

### 6.2 Manual reminder test

```javascript
// Bot console'da
const { checkRemindersNow } = require('./telegram/scheduler/reminderScheduler');
checkRemindersNow();
```

## 🎯 7. Bot Commands

Xodimlar uchun mavjud buyruqlar:

- `/start` - Ro'yxatdan o'tish
- `/profile` - Shaxsiy ma'lumotlar
- `/tasks` - Joriy topshiriqlar
- `/history` - Topshiriqlar tarixi
- `/help` - Yordam

## ⚠️ 8. Troubleshooting

### 8.1 Bot ishlamayapti

```bash
# Bot loglarini tekshiring
npm run bot

# Yoki debug mode'da
DEBUG=* npm run bot
```

### 8.2 Xodim ro'yxatdan o'ta olmayapti

1. Telefon raqam format to'g'rimi? (`+998901234567`)
2. Xodim tizimda mavjudmi?
3. Telefon raqami database'da to'g'ri saqlangan?

### 8.3 Notification kelmayapti

1. Bot ishlab turibmi?
2. Xodim Telegram ID saqlangan?
3. Notification settings yoqilgan?

```javascript
// Employee notification settings tekshirish
db.employees.findOne(
  { _id: ObjectId("EMPLOYEE_ID") },
  { notificationSettings: 1, telegramId: 1 }
)
```

### 8.4 Common Issues

**Issue 1: "Bot token invalid"**
```bash
# Solution: Token'ni qaytadan BotFather'dan oling va .env'ga yangilang
```

**Issue 2: "Cannot find employee by phone"**
```bash
# Solution: Database'da telefon format to'g'ri ekanini tekshiring
# Telefon: +998901234567 (+ belgisi bilan)
```

**Issue 3: "Notification service not available"**
```bash
# Solution: Bot ishga tushganini va notification service import qilganini tekshiring
```

## 🔒 9. Security

### 9.1 Bot Token xavfsizligi

- Bot token'ni hech qachon code'ga commit qilmang
- `.env` faylini `.gitignore`'ga qo'shing
- Production'da environment variables ishlatinsg

### 9.2 User Verification

- Faqat tizimda ro'yxatdan o'tgan xodimlar bot ishlatishi mumkin
- Telefon raqam orqali verification
- Rate limiting automatically enabled

## 📊 10. Monitoring

### 10.1 Bot Logs

```bash
# Bot activity ko'rish
tail -f bot.log

# Yoki console'da
npm run bot | tee bot.log
```

### 10.2 Database Monitoring

```javascript
// Telegram ID bor xodimlar soni
db.employees.countDocuments({ telegramId: { $exists: true } })

// Notification settings
db.employees.aggregate([
  { $group: { 
    _id: "$notificationSettings.receptionNotification",
    count: { $sum: 1 }
  }}
])
```

## 🎉 11. Production Deployment

### 11.1 PM2 bilan deploy

```bash
# PM2 o'rnatish
npm install -g pm2

# Bot'ni PM2 da ishga tushirish
pm2 start telegram/bot.js --name "qabulxona-bot"

# Auto restart
pm2 startup
pm2 save
```

### 11.2 Docker bilan deploy

```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🆘 Support

Agar muammolar bo'lsa:

1. [GitHub Issues](https://github.com/your-repo/issues) ga murojaat qiling
2. Yoki admin bilan bog'laning

Bot muvaffaqiyatli ishlayotgan bo'lsa, xodimlar avtomatik xabar olishni boshlaydilar! 🎉