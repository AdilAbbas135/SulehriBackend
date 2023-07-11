const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    category: { type: String },
    ncIssuerId: { type: String },
    contactId: { type: String },
    memberships: { type: Array },
    announcements: { type: Array },
    offerings: { type: Array },
  },
  { timestamps: true }
);

const OrganizationModel = mongoose.model("Organization", OrganizationSchema);
module.exports = OrganizationModel;
