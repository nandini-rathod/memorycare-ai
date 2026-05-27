const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String, required: true },
  photoUrl: String,
});

const storedFactSchema = new mongoose.Schema({
  fact: String,
  timestamp: { type: Date, default: Date.now },
});

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    cognitiveStage: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      default: "mild",
    },
    profilePhoto: String,
    familyMembers: [familyMemberSchema],
    preferences: [String],
    storedFacts: [storedFactSchema],
    dailySchedule: [
      {
        time: String, // "HH:MM"
        activity: String,
        completed: { type: Boolean, default: false },
        completedDate: String, // "YYYY-MM-DD"
      },
    ],
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caregiver",
      required: true,
    },
    aiTone: {
      type: String,
      enum: ["warm", "professional", "playful"],
      default: "warm",
    },
    emergencyContact: String,
    language: { type: String, default: "en" },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
