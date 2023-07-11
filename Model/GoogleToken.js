const mongoose = require("mongoose");
const { Schema } = mongoose;
const TokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    token: { type: String, required: true },
    expires_at: { type: Date, default: Date.now, expires: 600 }, //will expire after 10 minutes
  },
  { timestamps: true }
);
const TokenModel = mongoose.model("GoogleTokens", TokenSchema);
module.exports = TokenModel;
