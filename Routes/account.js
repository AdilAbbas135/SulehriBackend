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
const multer = require("multer");
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

// ROUTE 1 : REGISTER WITH MAIL AND SEND VERIFY EMAIL
router.post("/createaccount", async (req, res) => {
  console.log("request recieved");
  try {
    const finduser = await AllUsersModel.findOne({ Email: req.body.email });
    if (!finduser) {
      const finduser2 = await UserModel.findOne({ email: req.body.email });
      let user = null;
      if (!finduser2) {
        user = await UserModel.create({
          email: req.body.email,
          UserName: req.body.username,
          Password: req.body.password,
        });
      } else {
        user = finduser2;
      }
      if (user) {
        const token = assigntoken(user);
        if (token) {
          return res.status(200).json({
            success: true,
            // userId: user?._id,
            msg: "email has been sent to your email addrsss",
          });
        } else {
          return res
            .status(400)
            .json({ success: false, error: "error in sending the mail" });
        }
      } else {
        return res
          .status(400)
          .json({ success: false, error: "error in creating the user" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "This Email is Already Registered" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

async function assigntoken(user) {
  const token = await TokenModel.create({
    userId: user._id,
    token: require("crypto").randomBytes(32).toString("hex"),
  });
  const url = `${process.env.BASE_URL}auth/signup/emailverification?user=${user._id}&token=${token.token}`;
  const sendmail = await SendMail(user.email, "Verify Your Email Address", url);
  if (sendmail) {
    return true;
  } else {
    return false;
  }
}

// ROUTE 2 : VERIFY TOKEN/EMAIL AND CREATE USER ACCOUNT
router.post("/verifyemail/:userid/:token", async (req, res) => {
  const user = await UserModel.findById(req.params.userid);
  if (user) {
    const token = await TokenModel.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (token) {
      const newUser = await AllUsersModel.create({
        Email: user.email,
        UserName: user.UserName,
        Password: user.Password,
        isEmailVerified: true,
      });
      if (newUser) {
        await UserModel.findByIdAndDelete(req.params.userid);
        await TokenModel.findByIdAndDelete(token._id);
        const Profile = await ProfileModel.create({
          userId: newUser?._id,
          Email: newUser?.Email,
        });
        if (Profile) {
          const updateUserModel = await AllUsersModel.findByIdAndUpdate(
            Profile?.userId,
            {
              profileId: Profile?._id,
            }
          );
          if (updateUserModel) {
            const authtoken = jwt.sign(
              {
                userId: newUser.userId,
                profileId: Profile._id,
                email: Profile.Email,
                ProfilePicture: Profile.ProfilePicture,
                UserName: user?.UserName,
              },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "1d" }
            );
            return res.status(200).json({
              success: true,
              User: updateUserModel,
              Profile: Profile,
              authtoken,
              msg: " profile creaed and user model updated successfully",
            });
          } else {
            res.status(400).json({
              success: true,
              Profile: Profile,
              error: "profile created but user model was not updated",
            });
          }
        }
      } else {
        return res.status(400).json({
          success: false,
          user: false,
          msg: "error in creating the user account",
        });
      }
    } else {
      return res.status(400).json({ success: false, msg: "invalid Link" });
    }
  } else {
    return res.status(400).json({ success: false, msg: "Invalid Link" });
  }
});

// ROUTE 3 : Login User with Email and password
router.post("/login", async (req, res) => {
  try {
    const User = await AllUsersModel.findOne({ Email: req.body.email });
    if (User) {
      // const password = await bcrypt.compare(req.body.password, User.Password);
      if (User.Password === req.body.password) {
        const authtoken = jwt.sign(
          {
            userId: User?._id,
            profileId: User?.profileId,
            email: User?.Email,
            isEmailVerified: User?.isEmailVerified,
            UserName: User?.UserName,
          },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "1d" }
        );
        return res.status(200).json({
          success: true,
          msg: "Login Sucessfull",
          authtoken,
        });
      } else {
        return res
          .status(400)
          .json({ success: false, msg: "Wrong Credentials! Try Again" });
      }
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
    if (req.method === "POST") {
      try {
        const Profile = await ProfileModel.findOne({
          _id: req.user?.profileId,
          userId: req.user?.userId,
        });
        if (Profile) {
          const User = await AllUsersModel.findById(req.user?.userId);
          const Problems = await OfferingModel.find({
            profileId: req.user?.profileId,
          });

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
              userId: User?._id,
              profileId: User?.profileId,
              email: User?.Email,
              isEmailVerified: User?.isEmailVerified,
              UserName: User?.UserName,
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
          );
          res.status(200).json({
            Profile,
            authtoken,
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

// UPDATE PROFILE PICTURE OF USER
router.post(
  "/upload-profilepicture",
  VerifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (req.file.path) {
        const Profile = await ProfileModel.findById(req.user.profileId);
        if (Profile._id) {
          await Profile.update(
            {
              $set: {
                ProfilePicture: `http://localhost:5000/${req.file.path}`,
              },
            },
            { upsert: true }
          );
          return res.status(200).json({ msg: "Picture saved successfully" });
        } else {
          return res.status(404).json({ error: "Access denied" });
        }
      } else {
        return res.status(500).json({ error: "Error in Uploading Picture" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
