const mongoose = require("mongoose");
const { Schema } = mongoose;
const VotesSchema = new Schema(
  {
    DiscussionId: { type: mongoose.Types.ObjectId, required: true },
    Vote: {
      type: Number,
      required: true,
      // 0 mean Low
      // 1 mean High
    },
    profileId: { type: mongoose.Types.ObjectId, required: true },
  },
  { timestamps: true }
);
const VotesModel = mongoose.model("votes", VotesSchema);
module.exports = VotesModel;
