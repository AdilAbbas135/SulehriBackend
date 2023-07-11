const fs = require("fs");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const OfferingModel = require("../Model/Offering");
const VerifyToken = require("../Middlewear/VerifyToken");
const DiscussionReplyModel = require("../Model/Replies");
const VotesModel = require("../Model/Votes");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    const name = new Date().getTime() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

// GET ALL OFFERINGS
router.get("/", async (req, res) => {
  const offerings = await OfferingModel.find().sort({ createdAt: -1 });
  if (offerings) {
    return res.status(200).json({ success: true, offerings });
  } else {
    return res
      .status(404)
      .json({ success: false, msg: "error in getting the offerings" });
  }
});

// GET ALL OFFERINGS against an issuer
router.post("/getofferings/:issuerId", async (req, res) => {
  try {
    const offerings = await OfferingModel.find({
      profileId: req.params.issuerId,
    }).sort({ createdAt: -1 });
    if (offerings) {
      return res.status(200).json({ success: true, offerings });
    } else {
      return res
        .status(404)
        .json({ success: false, msg: "error in getting the offerings" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET A SINGLE OFFERING
router.get("/getsingleoffering/:id", async (req, res) => {
  const offer = await OfferingModel.findById(req.params.id);
  if (offer) {
    return res.status(200).json({ success: true, offer });
  } else {
    return res
      .status(404)
      .json({ success: false, msg: "error in getting the offering" });
  }
});
// POST AN OFFERING
router.post(
  "/addoffering",
  VerifyToken,
  upload.fields([{ name: "featuredImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      const offering = await OfferingModel.create({
        Name: req.body.Name,
        Description: req.body.Description,
        Location: req.body.Location,
        Priority: req.body.Priority,
        profileId: req.user.profileId,
        featuredImage: `http://localhost:5000/${req.files?.featuredImage[0]?.path}`,
      });
      if (offering) {
        return res
          .status(200)
          .json({ sucess: "true", msg: "offering created successfully" });
      } else {
        return res
          .status(404)
          .json({ success: false, msg: "Error creating in the offering" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Delete an offering
router.post("/deleteoffering", async (req, res) => {
  try {
    const deleteOffering = await OfferingModel.findByIdAndDelete(req.body.id);
    if (deleteOffering) {
      // console.log("the deleted offering is ");
      // console.log(deleteOffering.featuredImage.split("http://localhost:5000/"));

      // const path1 = deleteOffering.featuredImage.split(
      //   "http://localhost:5000/"
      // );
      // const path2 = deleteOffering?.logoImage?.split("http://localhost:5000/");
      // const path3 = deleteOffering?.bannerImage?.split("http://localhost:5000/");
      // fs?.unlinkSync(path1[1]);
      // fs?.unlinkSync(path2[1]);
      // fs?.unlinkSync(path3[1]);

      return res
        .status(200)
        .json({ success: true, msg: "Offering deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ success: false, msg: "Error in deleting the offering" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/post-reply", VerifyToken, async (req, res) => {
  const DiscussionId = req.query.DiscussionId;
  try {
    const reply = await DiscussionReplyModel.create({
      DiscussionId: DiscussionId,
      Answer: req.body.Answer,
      profileId: req.user.profileId,
    });
    return res.status(200).json({ success: true, msg: "Reply Posted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/post-vote", VerifyToken, async (req, res) => {
  const DiscussionId = req.query.DiscussionId;
  try {
    const vote = await VotesModel.create({
      DiscussionId: DiscussionId,
      Vote: req.body.Vote,
      profileId: req.user.profileId,
    });
    return res
      .status(200)
      .json({ success: true, msg: "Vote Given Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
