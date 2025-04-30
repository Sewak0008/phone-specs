// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(express.static(__dirname));
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const dataFile = './movies.json';

// Load movies from JSON file
function loadMovies() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile));
}

// Save movies to JSON file
function saveMovies(movies) {
  fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
}

app.get('/', (req, res) => {
  const movies = loadMovies();
  const categories = {};
  movies.forEach(movie => {
    if (!categories[movie.category]) categories[movie.category] = [];
    categories[movie.category].push(movie);
  });
  res.render('index', { categories });
});

app.get('/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/add.html'));
});

app.post('/add', (req, res) => {
  const { title, link, category, thumbnail } = req.body;
  const movies = loadMovies();
  movies.push({ title, link, category, thumbnail });
  saveMovies(movies);
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
