const express = require("express");
const router = express.Router();
const Movie = require("../models/movie");
const slugify = require("slugify");

// Home page: Display all movies
router.get("/", async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).send("Error retrieving movies.");
  }
});

// Add movie route (form submit)
router.post("/add", async (req, res) => {
  const { title, link, category } = req.body;

  // Validate input
  if (!title || !link || !category || !req.file) {
    return res.status(400).send("All fields are required.");
  }

  const thumbnail = `uploads/${req.file.filename}`; // Corrected path
  const slug = slugify(title, { lower: true });

  try {
    const movie = new Movie({ title, link, category, thumbnail, slug });
    await movie.save();
    res.redirect("/");
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      res.status(400).send("Movie already exists.");
    } else {
      res.status(500).send("Error saving movie.");
    }
  }
});

module.exports = router;