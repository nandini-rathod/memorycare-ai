const mongoose = require("mongoose");

const caregiverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    patientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Patient" }],
    phone: String,
    role: { type: String, enum: ["family", "doctor", "nurse"], default: "family" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Caregiver", caregiverSchema);
