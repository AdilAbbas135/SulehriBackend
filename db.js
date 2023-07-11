const mongoose = require("mongoose");
const dotenv = require("dotenv");

const connect_to_db = () => {
  dotenv.config();
  mongoose.connect(process.env.database_url, () => {
    console.log("connected to db successfullly");
  });
};

module.exports = connect_to_db;
