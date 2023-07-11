const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const TokenModel = require("../Model/GoogleToken");
const AllUsersModel = require("../Model/Allusers");
const UserModel = require("../Model/Users");
const SendMail = require("../utils/SendMail");
const ProfileModel = require("../Model/Profile");
const VerifyToken = require("../Middlewear/VerifyToken");
const OfferingModel = require("../Model/Offering");
const AdminModel = require("../Model/Admin");
const DiscussionReplyModel = require("../Model/Replies");
const { default: mongoose } = require("mongoose");

// ROUTE 3 : Login User with Email and password
router.post("/login", async (req, res) => {
  try {
    const User = await AdminModel.findOne({
      Email: req.body.email,
      Password: req.body.password,
    });
    if (User) {
      // const password = await bcrypt.compare(req.body.password, User.Password);

      const authtoken = jwt.sign(
        {
          userId: User?._id,
          email: User?.Email,
          role: "admin",
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1d" }
      );
      return res.status(200).json({
        success: true,
        msg: "Login Sucessfull",
        token: authtoken,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, msg: "Wrong Credentials! Try Again" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, msg: "Internal Server Error" });
  }
});

// FIND Teacher AT POST REQUEST AND RETURNS Teacher DATA
router.post("/find-profile", VerifyToken, async (req, res) => {
  try {
    // console.log("i am also calling");
    if (req.method === "POST") {
      try {
        // console.log(req.user);
        const Profile = await AdminModel.findOne({
          _id: req.user?.userId,
        });
        if (Profile) {
          const Problems = await OfferingModel.aggregate([
            {
              $lookup: {
                from: "votes",
                localField: "_id",
                foreignField: "DiscussionId",
                as: "votes",
              },
            },
            {
              $lookup: {
                from: "discussion-replies",
                localField: "_id",
                foreignField: "DiscussionId",
                as: "replies",
              },
            },
            { $sort: { createdAt: -1 } },
          ]);

          // FINDING HIGH PRIORITY PROBLEMS
          var HighPriorityProblems = 0;
          for (let index = 0; index < Problems?.length; index++) {
            if (Problems[index]?.Priority === 2) {
              HighPriorityProblems = HighPriorityProblems + 1;
            }
          }

          // FINDING SOLVED PROBLEMS
          var SolvedProblems = 0;
          for (let index = 0; index < Problems?.length; index++) {
            if (Problems[index]?.Status === 2) {
              SolvedProblems = SolvedProblems + 1;
            }
          }

          const authtoken = jwt.sign(
            {
              userId: Profile?._id,
              email: Profile?.Email,
              role: "admin",
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
          );
          res.status(200).json({
            Profile,
            token: authtoken,
            Problems,
            HighPriorityProblems,
            SolvedProblems,
          });
        } else {
          res.status(404).json({
            Success: false,
            error: "Access Denied",
          });
        }
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
          errorMessage: error.message,
        });
      }
    } else {
      res.status(404).json({
        Success: false,
        error: "Access Denied",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET ALL OFFERINGS
// router.post("/offerings", VerifyToken, async (req, res) => {
//   try {
//     const offerings = await OfferingModel.find().sort({ createdAt: -1 });
//     if (offerings) {
//       return res.status(200).json({ success: true, offerings });
//     } else {
//       return res
//         .status(404)
//         .json({ success: false, msg: "error in getting the offerings" });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// CHECK SINGLE PROBLEM DETAILS
router.post("/offerings/:id", VerifyToken, async (req, res) => {
  try {
    // console.log("i am called with");
    const Problem = await OfferingModel.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "discussion-replies",
          localField: "_id",
          foreignField: "DiscussionId",
          as: "Replies",
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
    if (Problem) {
      return res.status(200).json({ Problem: Problem[0] });
    } else {
      return res
        .status(404)
        .json({ success: false, msg: "error in getting the offerings" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// UPDATE PROBLEM
router.post("/offerings/:id/update", VerifyToken, async (req, res) => {
  try {
    // console.log(req.body);
    const FindProblem = await OfferingModel.findById(req.params.id);
    if (FindProblem) {
      await FindProblem.update(
        {
          $set: {
            Priority: req.body?.Priority,
            Status: req.body?.Status,
          },
        },
        { upsert: true }
      );
      return res
        .status(200)
        .json({ success: true, message: "Problem updated successfully" });
    } else {
      return res.status(500).json({ error: "ACCESS_DENIED" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE PROBLEM
router.post("/offerings/:id/delete", VerifyToken, async (req, res) => {
  try {
    await OfferingModel.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Problem Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
