const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["patient", "ai"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const conversationLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    messages: [messageSchema],
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    distressScore: { type: Number, default: 0 },
    sessionSummary: String,
    extractedFacts: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConversationLog", conversationLogSchema);
