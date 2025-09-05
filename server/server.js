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
    ? ['https://qabulxona-client.onrender.com', 'https://qabulxona-api.onrender.com']
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
app.use("/api/schedule", scheduleRoutes); // Bu route /api/daily-plan ni ham qamrab oladi
app.use('/api/auth', authRoutes);
app.use('/api/reception-history', receptionHistoryRoutes);
app.use('/api/admins', adminRoutes);

// Daily plan uchun alohida route (agar kerak bo'lsa)
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

// Telegram bot'ni ishga tushirish
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    require('./telegram/bot');
    console.log('🤖 Telegram bot imported successfully');
  } catch (error) {
    console.error('❌ Failed to import Telegram bot:', error.message);
    console.log('⚠️ Server will continue without Telegram bot');
  }
} else {
  console.log('⚠️ TELEGRAM_BOT_TOKEN not found. Telegram bot disabled.');
}

const PORT = process.env.PORT || 5000;

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, async () => {
    console.log(`Server ${PORT} portda ishga tushdi`);
});
