const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  link: { type: String, required: true },
  thumbnail: { type: String },
  category: { type: String },
  slug: { type: String, unique: true }
});

module.exports = mongoose.model("Movie", movieSchema);