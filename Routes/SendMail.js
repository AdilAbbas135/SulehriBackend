const express = require("express");
const SendMail = require("../utils/SendMail");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const Message = `\nName = ${req.body.Name}\nEmail = ${req.body.Email}\nMessage = ${req.body.Message}`;
    const sendmail = await SendMail(
      "arsulehri7@gmail.com",
      req.body.Subject,
      Message
    );
    if (sendmail) {
      return res.status(200).json({ msg: "Email sent successfully" });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
