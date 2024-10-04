const express = require('express');
const router = express.Router();
const db = require('../models/db');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs'); // Per gestire il filesystem

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

// Middleware
const isAuthenticated = (req, res, next) => {
  if (!req.cookies.userId) {
    return next();
  }
  // Se il cookie esiste reindirizza al profilo
  return res.redirect(`/profile/${req.cookies.userId}`);
};

// Registrazione
router.get('/register', isAuthenticated, (req, res) => {
  res.render('user/register', { title: 'Registrati', errorMessage: null });
});

router.post('/register', isAuthenticated, (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Password non corrispondono
  if (password !== confirmPassword) {
    return res.render('user/register', {
      title: 'Registrazione',
      errorMessage: 'Le password non corrispondono.',
    });
  }

  // Username già in uso
  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  db.execute(checkQuery, [username], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      return res.render('user/register', {
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
router.get('/login', isAuthenticated, (req, res) => {
  res.render('user/login', { title: 'Login', errorMessage: null });
});

router.post('/login', isAuthenticated, (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.execute(query, [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.render('user/login', {
        title: 'Login',
        errorMessage: 'Nome utente non trovato.',
      });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) throw err;

      // Se le credenziali sono corrette
      if (match) {
        res.cookie('userId', user.id, { maxAge: 900000, httpOnly: true });
        return res.redirect(`/`);
      } else {
        return res.render('user/login', {
          title: 'Login',
          errorMessage: 'Password errata.',
        });
      }
    });
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('userId'); // Rimuove il cookie
  res.redirect('/');
});

// Profilo
router.get('/profile/:id', (req, res) => {
  const userId = req.params.id; // id dal url
  const query = 'SELECT * FROM users WHERE id = ?';
  db.execute(query, [userId], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.redirect('/login');
    }

    const user = results[0];
    res.render('user/profile', { title: 'Il tuo profilo', user });
  });
});

// Aggiornamento del profilo
router.post('/update/:id', upload.single('profile_image'), (req, res) => {
  const { username, password } = req.body;
  const profileImage = req.file ? req.file.filename : null;
  const userId = req.params.id; // id dall'url

  // Inizializza la query di aggiornamento
  let query = 'SELECT profile_image FROM users WHERE id = ?'; // Immagine attuale
  db.execute(query, [userId], (err, results) => {
    if (err) throw err;

    // Controlliamo se l'utente esiste
    if (results.length === 0) {
      return res.redirect('/login'); // L'utente non esiste, reindirizza
    }

    const currentProfileImage = results[0].profile_image; // Immagine attuale

    // Inizializza la query di aggiornamento
    let updateQuery = 'UPDATE users SET ';
    const params = [];
    let updates = []; // Array per gli aggiornamenti

    // Se il nome utente è fornito
    if (username && username.trim() !== '') {
      updates.push('username = ?');
      params.push(username);
    }

    // Se la password è fornita
    if (password && password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    // Se è presente una nuova immagine
    if (profileImage) {
      updates.push('profile_image = ?');
      params.push(profileImage);
    }

    if (updates.length === 0) {
      return res.redirect(`/profile/${userId}`); // Se non ci sono campi da aggiornare
    }

    // Unisci gli aggiornamenti nella query
    updateQuery += updates.join(', ') + ' WHERE id = ?';
    params.push(userId);

    // Esegui l'aggiornamento nel database
    db.execute(updateQuery, params, (err) => {
      if (err) throw err;

      // Elimina l'immagine attuale se cè una nuova immagine
      if (profileImage && currentProfileImage) {
        const imagePath = path.join(
          __dirname,
          '../public/images',
          currentProfileImage
        );
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Errore nella rimozione dell'immagine: ${err}`);
          }
        });
      }

      res.redirect(`/profile/${userId}`);
    });
  });
});

// Cancellazione del profilo
router.post('/delete/:id', (req, res) => {
  const userId = req.params.id; // Prendi l'ID dall'URL

  // Se l'utente è autenticato
  if (!req.cookies.userId || req.cookies.userId != userId) {
    return res.status(403).send('Accesso negato.'); // Se non è l'utente
  }

  // Query per immagine profilo
  const query = 'SELECT profile_image FROM users WHERE id = ?';
  db.execute(query, [userId], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.redirect('/'); // Se l'utente non esiste
    }

    const profileImage = results[0].profile_image;

    // Elimina l'utente dal database
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    db.execute(deleteQuery, [userId], (err) => {
      if (err) throw err;

      // Se esiste un'immagine rimuovi
      if (profileImage) {
        const imagePath = path.join(
          __dirname,
          '../public/images',
          profileImage
        );
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Errore nella rimozione dell'immagine: ${err}`);
          } else {
            console.log(`Immagine ${profileImage} rimossa con successo.`);
          }
        });
      }

      res.clearCookie('userId');
      res.redirect('/');
    });
  });
});

module.exports = (db) => {
  return router;
};
