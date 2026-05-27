const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const DistressEvent = require("../models/DistressEvent");
const authMiddleware = require("../middleware/auth");

// GET all patients (no auth - used for patient selection)
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().select("_id name age cognitiveStage");
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET patient by ID (no auth - used by patient interface)
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select(
      "-caregiverId"
    );
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET patient schedule
router.get("/:id/schedule", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select("dailySchedule name");
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ schedule: patient.dailySchedule, patientName: patient.name });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH mark schedule item complete
router.patch("/:id/schedule/:index/complete", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const idx = parseInt(req.params.index);
    if (patient.dailySchedule[idx]) {
      patient.dailySchedule[idx].completed = true;
      patient.dailySchedule[idx].completedDate = new Date().toISOString().split("T")[0];
    }
    await patient.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST emergency alert
router.post("/:id/emergency", async (req, res) => {
  try {
    const io = req.app.get("io");
    const patient = await Patient.findById(req.params.id).select("name caregiverId");
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const event = await DistressEvent.create({
      patientId: req.params.id,
      triggerType: "help_button",
      messageSnippet: "Patient pressed the HELP button",
      distressScore: 10,
    });

    // Emit to caregivers
    io.to(`caregiver_${req.params.id}`).emit("emergency_alert", {
      patientId: req.params.id,
      patientName: patient.name,
      timestamp: new Date().toISOString(),
      message: `🚨 ${patient.name} pressed the HELP button!`,
    });

    res.json({ success: true, eventId: event._id });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST acknowledge reminder
router.post("/:id/reminder-ack", async (req, res) => {
  try {
    const { reminderId } = req.body;
    const Reminder = require("../models/Reminder");
    await Reminder.findByIdAndUpdate(reminderId, { acknowledgedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
