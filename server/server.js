require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Routerlarni import qilish
const employeeRoutes = require("./routes/employees");
const meetingRoutes = require("./routes/meetings");
const scheduleRoutes = require("./routes/schedule");
const receptionHistoryRoutes = require("./routes/receptionHistory");
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

require('./models/Admin');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://qabulxona-client.onrender.com', 'https://qabulxona-api.onrender.com', 'https://qabulxona-metro.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(
  "/uploadObektivka",
  express.static(path.join(__dirname, "uploadObektivka"))
);

// Routerlarni ulash
app.use("/api/employees", employeeRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reception-history', receptionHistoryRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/daily-plan', scheduleRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Qabulxona API Documentation'
}));

// Error handling middleware
app.use(errorHandler);

// MongoDB ga ulanish
connectDB();

const PORT = process.env.PORT || 5000;

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Bot initialization - faqat bir marta
let botInitialized = false;

async function initializeTelegramBot() {
  if (botInitialized) {
    console.log('⚠️ Bot already initialized, skipping...');
    return;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN not found. Telegram bot disabled.');
    return;
  }

  try {
    // Bot modulini import qilish
    const { bot, notificationService } = require('./telegram/bot');
    
    // Global notification service
    global.telegramNotificationService = notificationService;
    
    console.log('🤖 Telegram bot initialized successfully');
    botInitialized = true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    console.log('⚠️ Server will continue without Telegram bot');
  }
}

// Server ishga tushishi
app.listen(PORT, async () => {
  console.log(`Server ${PORT} portda ishga tushdi`);
  
  // Bot ni server to'liq ishga tushgandan keyin initialize qilish
  setTimeout(() => {
    initializeTelegramBot();
  }, 2000); // 2 sekund kutish
});