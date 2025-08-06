require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

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
app.use(cors());
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

// Error handling middleware
app.use(errorHandler);

// MongoDB ga ulanish
connectDB();

const PORT = process.env.PORT || 5000;

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, async () => {
    console.log(`Server ${PORT} portda ishga tushdi`);
});
