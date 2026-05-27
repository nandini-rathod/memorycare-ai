const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    imageUrl: { type: String, required: true },
    publicId: String, // Cloudinary public ID for deletion
    caption: { type: String, required: true },
    personName: String,
    relation: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Photo", photoSchema);
