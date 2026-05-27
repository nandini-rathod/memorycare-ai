const Reminder = require("../models/Reminder");
const Patient = require("../models/Patient");

const DAY_MAP = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

async function checkReminders(io) {
  try {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDay = DAY_MAP[now.getDay()];

    const dueReminders = await Reminder.find({
      time: currentTime,
      isActive: true,
      days: currentDay,
    });

    for (const reminder of dueReminders) {
      // Check if already fired in last 2 minutes (prevent double firing)
      if (reminder.lastFired) {
        const timeSinceFired = now - new Date(reminder.lastFired);
        if (timeSinceFired < 90000) continue; // < 90 seconds
      }

      // Update lastFired
      await Reminder.findByIdAndUpdate(reminder._id, { lastFired: now });

      // Emit to patient's page
      io.to(`patient_${reminder.patientId}`).emit("reminder", {
        id: reminder._id,
        message: reminder.message,
        type: reminder.type,
        timestamp: now.toISOString(),
      });

      // Also notify caregiver
      io.to(`caregiver_${reminder.patientId}`).emit("reminder_sent", {
        reminderId: reminder._id,
        message: reminder.message,
        patientId: reminder.patientId,
        timestamp: now.toISOString(),
      });

      console.log(`⏰ Reminder sent to patient ${reminder.patientId}: ${reminder.message}`);
    }
  } catch (err) {
    console.error("Cron error:", err.message);
  }
}

module.exports = { checkReminders };
