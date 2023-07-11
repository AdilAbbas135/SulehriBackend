const mongoose = require("mongoose");
const { Schema } = mongoose;
const AllUsersSchema = new Schema(
  {
    Email: {
      type: String,
      required: true,
      unique: true,
    },
    Password: {
      type: String,
    },
    UserName: {
      type: String,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const AllUsersModel = mongoose.model("AllUsers", AllUsersSchema);
module.exports = AllUsersModel;
