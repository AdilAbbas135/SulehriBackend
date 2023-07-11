const express = require("express");
const { default: mongoose } = require("mongoose");
const OfferingModel = require("../Model/Offering");
const DiscussionReplyModel = require("../Model/Replies");
const VotesModel = require("../Model/Votes");
const router = express.Router();

router.get("/homeproblems", async (req, res) => {
  // console.log("request recieved at the backend");
  try {
    const problems = await OfferingModel.find()
      .limit(4)
      .sort({ createdAt: -1 });
    return res.status(200).json(problems);
    // const Votes = await VotesModel.count({ DiscussionId: ProblemId });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/problems", async (req, res) => {
  // console.log("request recieved at the backend");
  try {
    const problems = await OfferingModel.aggregate([
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "User",
        },
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "DiscussionId",
          as: "Votes",
        },
      },
      {
        $lookup: {
          from: "allusers",
          localField: "profileId",
          foreignField: "profileId",
          as: "UserDetails",
        },
      },

      { $sort: { createdAt: -1 } },
    ]);
    // const Votes = await VotesModel.count({ DiscussionId: ProblemId });
    return res.status(200).json(problems);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/replies", async (req, res) => {
  try {
    const ProblemId = req.query.ProblemId;
    const Problem = await OfferingModel.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(ProblemId),
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "User",
        },
      },
      {
        $lookup: {
          from: "allusers",
          localField: "profileId",
          foreignField: "profileId",
          as: "UserDetails",
        },
      },
    ]);
    const Answers = await DiscussionReplyModel.aggregate([
      {
        $match: {
          DiscussionId: mongoose.Types.ObjectId(ProblemId),
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "User",
        },
      },
      {
        $lookup: {
          from: "allusers",
          localField: "profileId",
          foreignField: "profileId",
          as: "UserDetails",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    const Votes = await VotesModel.count({ DiscussionId: ProblemId });
    const isAlreadyApplied = await VotesModel.findOne({
      profileId: req.body?.profileId,
      DiscussionId: ProblemId,
    });
    return res
      .status(200)
      .json({ Problem: Problem[0], Replies: Answers, Votes, isAlreadyApplied });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Internal Server Error! Try Again Later" });
  }
});

router.post("/searchproblem", async (req, res) => {
  // console.log("request recieved at the backend");
  try {
    console.log(req.body);
    const problems = await OfferingModel.aggregate([
      {
        $match: {
          $or: [
            {
              Name: {
                $regex: req.body?.Title ? req.body?.Title : "NoTitleFound",
              },
            },
            {
              Location: {
                $regex: req.body?.Location
                  ? req.body?.Location
                  : "NoTitleFound",
              },
            },
            { Priority: req.body?.Priority },
          ],
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "profileId",
          foreignField: "_id",
          as: "User",
        },
      },
      {
        $lookup: {
          from: "votes",
          localField: "_id",
          foreignField: "DiscussionId",
          as: "Votes",
        },
      },

      { $sort: { createdAt: -1 } },
    ]);
    return res.status(200).json(problems);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
