const mongoose = require("mongoose");

const OfferingSchema = new mongoose.Schema(
  {
    Name: { type: String },
    Location: { type: String },
    Priority: {
      type: Number,
      // 0 Low
      // 1 Medium
      // 2 High
    },
    Description: { type: String },
    profileId: { type: mongoose.Types.ObjectId, required: true },
    Status: {
      type: Number,
      default: 0,
      // 0 means pending
      // 1 means in progress
      // 2 means completed
    },
    featuredImage: { type: String },
    // logoImage: { type: String },
    bannerImage: { type: String },
  },
  { timestamps: true }
);

const OfferingModel = mongoose.model("Offering", OfferingSchema);
module.exports = OfferingModel;
