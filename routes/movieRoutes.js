const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");
const slugify = require("slugify");

// Home page: Display all movies
router.get("/", async (req, res) => {
  const movies = await Movie.find();
  const grouped = {};

  movies.forEach(movie => {
    if (!grouped[movie.category]) grouped[movie.category] = [];
    grouped[movie.category].push(movie);
  });

  const categories = Object.keys(grouped).map(cat => ({
    name: cat,
    movies: grouped[cat]
  }));

  res.render("index", { categories });
});

// Add movie route (form submit)
router.post("/add", async (req, res) => {
  const { title, link, category } = req.body;
  const thumbnail = /uploads/${req.file.filename};
  const slug = slugify(title, { lower: true });

  try {
    const movie = new Movie({ title, link, category, thumbnail, slug });
    await movie.save();
    res.redirect("/");
  } catch (err) {
    res.status(400).send("Movie already exists or invalid input.");
  }
});

module.exports = router;