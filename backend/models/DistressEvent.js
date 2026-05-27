const mongoose = require("mongoose");

const distressEventSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    triggerType: {
      type: String,
      enum: [
        "confusion_keyword",
        "short_response",
        "repeated_question",
        "help_button",
        "negative_emotion",
      ],
    },
    messageSnippet: String,
    distressScore: Number,
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: Date,
    acknowledgedBy: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DistressEvent", distressEventSchema);
