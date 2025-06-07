const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const phones = require('./phones.json');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = './phones.json';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sample user
const users = [
  {
    username: 'depu',
    password: '$2a$12$8TSa6BHsceWjnHY9XC/A7.Hb976ZLeXVMTr89IHN6hxt0/rhgN8RO' // "admin123"
  }
];

// Utility functions
function loadPhones() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile));
}

function savePhones(phones) {
  fs.writeFileSync(dataFile, JSON.stringify(phones, null, 2));
}

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login.html');
}

app.get('/compare', (req, res) => {
  const allPhones = loadPhones(); // Load all phones
  const title1 = req.query.phone1;
  const title2 = req.query.phone2;

  if (title1 && title2) {
    const phone1 = allPhones.find(p => p.title === title1);
    const phone2 = allPhones.find(p => p.title === title2);

    if (!phone1 || !phone2) {
      return res.status(404).send('Phone not found');
    }

    res.render('compare', { phones: [phone1, phone2] });
  } else {
    // Agar user ne phone select nahi kiya, to sab phones bhej do for dropdown etc
    res.render('compare', { phones: allPhones });
  }
});


app.get('/latest', (req, res) => {
  res.render('latest'); // latest.ejs ya latest.html hona chahiye views/public folder me
});

app.get('/top-gaming', (req, res) => {
  res.render('top-gaming');
});

app.get('/budget-phones', (req, res) => {
  res.render('budget-phones');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/privacy', (req, res) => {
  res.render('privacy'); // ✅ this should match file name exactly
});

app.get('/terms', (req, res) => {
  res.render('terms');
});

// Routes
app.get('/', (req, res) => {
  const phones = loadPhones().reverse();
  const latestPhones = phones.slice(0, 20);

  const categories = {};
  phones.forEach(phone => {
    if (!categories[phone.category]) categories[phone.category] = [];
    categories[phone.category].push(phone);
  });

  res.render('index', {
    categories,
    latestPhones,
    page: 1,
    totalPages: 1,
    searchBrand: null,
    query: null,
    sort: null
  });
});


app.get('/phones', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const allPhones = loadPhones().reverse();
  const paginated = allPhones.slice(skip, skip + limit);

  const categories = { All: paginated };
  const totalPages = Math.ceil(allPhones.length / limit);

  res.render('index', {
    categories,
    latestPhones: null,
    page,
    totalPages,
    searchBrand: null,
    query: null,
    sort: null
  });
});


app.get('/category/:name', (req, res) => {
  const category = req.params.name;
  const phones = loadPhones().reverse();
  const filtered = phones.filter(p => p.category.toLowerCase() === category.toLowerCase());

  const categories = {};
  categories[category] = filtered;

  res.render('index', {
    categories,
    latestPhones: null,
    page: 1,
    totalPages: 1,
    searchBrand: null,
    query: null,
    sort: null
  });
});

app.get('/search', (req, res) => {
  const brand = req.query.brand ? req.query.brand.toLowerCase() : '';
  const query = req.query.query ? req.query.query.toLowerCase() : '';
  const phones = loadPhones().reverse();
  let matchedPhones = [];

  if (brand) {
    matchedPhones = phones.filter(phone =>
      phone.brand && phone.brand.toLowerCase() === brand
    );
  } else if (query) {
    matchedPhones = phones.filter(phone =>
      phone.title && phone.title.toLowerCase().includes(query)
    );
  }

  const categories = {};
  const label = brand || query || "Search";
  categories[label] = matchedPhones;

  res.render('index', {
    categories,
    latestPhones: null,
    page: 1,
    totalPages: 1,
    searchBrand: brand || null,
    query: query || null,
    sort: null
  });
});

app.get('/phone/:title', (req, res) => {
  const phones = loadPhones();
  const phone = phones.find(p => p.title === req.params.title);
  if (!phone) return res.status(404).send("Phone not found");
  res.render('phone', { phone });
});

app.get('/admin', isAuthenticated, (req, res) => {
  const phones = loadPhones();
  res.render('admin', { phones });
});

app.get('/add', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/add.html'));
});

app.post('/add', isAuthenticated, (req, res) => {
  const { title, category, thumbnail, description, price, ram, storage, battery, display, chipset } = req.body;

  const newPhone = {
    title,
    category,
    thumbnail,
    description,
    specs: {
      price,
      ram,
      storage,
      battery,
      display,
      chipset
    }
  };

  const phones = loadPhones();
  phones.push(newPhone);
  savePhones(phones);

  res.redirect('/');
});

app.get('/ranking', (req, res) => {
  const category = req.query.category || 'gaming'; // Default category
  let phones = loadPhones(); // Load all phones

  // Use manual rankings instead of calculated ones
  phones = phones
    .filter(p => p.rankings && p.rankings[category] !== undefined)
    .sort((a, b) => a.rankings[category] - b.rankings[category]);

  res.render('ranking', { rankedPhones: phones, category });
});

app.get('/phone/:id', async (req, res) => {
  const phone = await Phone.findById(req.params.id);
  res.render('phone-details', { phone });
});


app.get("/phone/:title/gallery", (req, res) => {
  const title = req.params.title;
  const phone = phones.find(p => p.title === title);
  if (!phone) return res.status(404).send("Phone not found");
  res.render("gallery", { phone });
});


app.get('/delete/:title', isAuthenticated, (req, res) => {
  const title = req.params.title;
  let phones = loadPhones();
  phones = phones.filter(p => p.title !== title);
  savePhones(phones);
  res.redirect('/admin');
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.send('Invalid user');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Invalid password');

    req.session.user = username;
    res.redirect('/admin');
  } catch (err) {
    console.error("Login error:", err);
    res.send("Something went wrong");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
