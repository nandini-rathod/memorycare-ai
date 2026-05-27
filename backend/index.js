require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patient");
const caregiverRoutes = require("./routes/caregiver");
const aiRoutes = require("./routes/ai");
const photoRoutes = require("./routes/photos");

const { checkReminders } = require("./services/reminderCron");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in routes
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/caregiver", caregiverRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/photos", photoRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.io connection handling
const connectedCaregivers = new Map(); // patientId -> Set of socket IDs
const connectedPatients = new Map();   // patientId -> socket ID

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("join_patient", (patientId) => {
    socket.join(`patient_${patientId}`);
    connectedPatients.set(patientId, socket.id);
    console.log(`Patient ${patientId} connected`);
  });

  socket.on("join_caregiver", ({ caregiverId, patientIds }) => {
    patientIds?.forEach((pid) => {
      socket.join(`caregiver_${pid}`);
    });
    console.log(`Caregiver ${caregiverId} connected`);
  });

  socket.on("disconnect", () => {
    connectedPatients.forEach((sid, pid) => {
      if (sid === socket.id) connectedPatients.delete(pid);
    });
    console.log("Socket disconnected:", socket.id);
  });
});

// Make io and connected maps available globally for cron
global.io = io;
global.connectedPatients = connectedPatients;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    // Start reminder cron job (every minute)
    cron.schedule("* * * * *", () => {
      checkReminders(io);
    });
    console.log("⏰ Reminder cron started");

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
