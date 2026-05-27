const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    time: { type: String, required: true }, // "HH:MM" format
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["medicine", "meal", "water", "appointment", "activity", "other"],
      default: "other",
    },
    isActive: { type: Boolean, default: true },
    days: {
      type: [String],
      default: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    },
    lastFired: Date,
    acknowledgedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);
