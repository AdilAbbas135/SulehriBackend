const mongoose = require("mongoose");
const { Schema } = mongoose;
const ReplySchema = new Schema(
  {
    DiscussionId: { type: mongoose.Types.ObjectId, required: true },
    Answer: { type: "string", required: true },
    profileId: { type: mongoose.Types.ObjectId, required: true },
    Votes: { type: [Object] },
  },
  { timestamps: true }
);
const DiscussionReplyModel = mongoose.model("discussion-replies", ReplySchema);
module.exports = DiscussionReplyModel;
