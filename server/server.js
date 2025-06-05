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
const receptionHistoryService = require("./services/receptionHistoryService");

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
app.use("/api/schedule", scheduleRoutes);
app.use("/api/reception-history", receptionHistoryRoutes);

// Error handling middleware
app.use(errorHandler);

// MongoDB ga ulanish
connectDB().then(() => {
  // Start auto-archiving schedule after DB connection is established
  receptionHistoryService.scheduleAutoArchive().catch((err) => {
    console.error("Failed to initialize auto-archiving:", err);
  });
});

const PORT = process.env.PORT || 5000;

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
