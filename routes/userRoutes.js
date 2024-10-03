const express = require('express');
const router = express.Router();
const db = require('../models/db');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');

// Uupload delle immagini
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Cartella
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome del file
  },
});

const upload = multer({ storage: storage });

// Registrazione
router.get('/register', (req, res) => {
  res.render('register', { title: 'Registrati', errorMessage: null });
});

router.post('/register', (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Password non corrispondono
  if (password !== confirmPassword) {
    return res.render('register', {
      title: 'Registrazione',
      errorMessage: 'Le password non corrispondono.',
    });
  }

  // Username già in uso
  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  db.execute(checkQuery, [username], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      return res.render('register', {
        title: 'Registrati',
        errorMessage: 'Username già in uso.',
      });
    }

    // Hash della password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) throw err;
      // Inserimento nel database
      const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
      db.execute(query, [username, hashedPassword], (err) => {
        if (err) throw err;
        res.redirect('/login'); // Dopo la registrazione, reindirizza al login
      });
    });
  });
});

// Login
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', errorMessage: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.execute(query, [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.render('login', {
        title: 'Login',
        errorMessage: 'Nome utente non trovato.',
      });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) throw err;

      // Se le credenziali sono corrette
      if (match) {
        return res.redirect(`/profile/${user.id}`); // Redirect al profilo dell'utente
      } else {
        return res.render('login', {
          title: 'Login',
          errorMessage: 'Password errata.',
        });
      }
    });
  });
});

// Profilo
router.get('/profile/:id', (req, res) => {
  const userId = req.params.id; // id dal url
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [userId], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.redirect('/login'); // Se non trovato, reindirizza al login
    }

    const user = results[0];
    res.render('profile', { title: 'Il tuo profilo', user });
  });
});

// Aggiornamento del profilo
router.post('/update/:id', upload.single('profile_image'), (req, res) => {
  const { username, password } = req.body;
  const profileImage = req.file ? req.file.filename : null;
  const userId = req.params.id; // id dall url

  // Query di aggiornamento
  let query = 'UPDATE users SET username = ?';
  const params = [username];

  // Se la password è fornita
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }

  // Immagine di profilo se presente
  if (profileImage) {
    query += ', profile_image = ?';
    params.push(profileImage);
  }

  // Condizione WHERE
  query += ' WHERE id = ?';
  params.push(userId);

  // Query
  db.execute(query, params, (err) => {
    if (err) throw err;

    res.redirect(`/profile/${userId}`);
  });
});

module.exports = (db) => {
  return router;
};
