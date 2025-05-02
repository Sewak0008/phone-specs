const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = './movies.json';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secretkey123', // Use a strong and unique secret
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sample user data
const users = [
  {
    username: 'admin',
    password: '$2b$10$Z19pMZHcPwaqtsWGG0Y0rein7e/W8Tcn7rbpsE/KYdF4eL27pGsbW' // Hash for "admin123"
  }
];

// Load movies from JSON file
function loadMovies() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile));
}

// Save movies to JSON file
function saveMovies(movies) {
  fs.writeFileSync(dataFile, JSON.stringify(movies, null, 2));
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

// Routes
app.get('/', (req, res) => {
  const movies = loadMovies().reverse(); // Latest movie first
  const categories = {};

  movies.forEach(movie => {
    if (!categories[movie.category]) categories[movie.category] = [];
    categories[movie.category].push(movie);
  });

  res.render('index', { categories });
});

app.get('/movies', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const allMovies = loadMovies();
  const paginated = allMovies.slice(skip, skip + limit);

  const categories = {};
  paginated.forEach(movie => {
    if (!categories[movie.category]) categories[movie.category] = [];
    categories[movie.category].push(movie);
  });

  res.render('index', { categories, page });
});

app.get('/category/:name', (req, res) => {
  const category = req.params.name;
  const movies = loadMovies().reverse(); // Latest first

  const filtered = movies.filter(movie => movie.category.toLowerCase() === category.toLowerCase());

  const categories = {};
  categories[category] = filtered;

  res.render('index', { categories });
});

app.get('/movie/:title', (req, res) => {
  const movies = loadMovies();
  const movie = movies.find(m => m.title === req.params.title);
  if (!movie) return res.status(404).send("Movie not found");
  res.render('movie', { movie });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Raw body:", req.body);
    console.log("Username from form:", username);
    console.log("Password from form:", password);

    const user = users.find(u => u.username === username);
    if (!user) {
      console.log("User not found");
      return res.send('Invalid user');
    }

    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match);

    if (!match) return res.send('Invalid password');

    req.session.user = username;
    res.redirect('/admin');
  } catch (err) {
    console.error("Error in /login:", err);
    res.send("Something went wrong");
  }
});
// Admin route
app.get('/admin', isAuthenticated, (req, res) => {
  const movies = loadMovies();
  res.render('admin', { movies });
});

// Add movie route
app.get('/add', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/add.html'));
});

app.post('/add', isAuthenticated, (req, res) => {
  const { title, category, thumbnail, description, print480, print720, print1080 } = req.body;

  const newMovie = {
    title,
    category,
    thumbnail,
    description,
    prints: []
  };

  if (print480) newMovie.prints.push({ quality: '480p', url: print480 });
  if (print720) newMovie.prints.push({ quality: '720p', url: print720 });
  if (print1080) newMovie.prints.push({ quality: '1080p', url: print1080 });

  const movies = loadMovies();
  movies.push(newMovie);
  saveMovies(movies);

  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});