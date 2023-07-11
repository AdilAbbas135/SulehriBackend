const mongoose = require("mongoose");
const { Schema } = mongoose;
const AdminSchema = new Schema({
  Email: { type: String, required: true },
  Password: { type: String, required: true },
});

const AdminModel = mongoose.model("admin", AdminSchema);
module.exports = AdminModel;
