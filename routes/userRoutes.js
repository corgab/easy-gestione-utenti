const express = require('express');
const router = express.Router();
const db = require('../models/db'); 
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');

// immagini profilo
const upload = multer({dest: 'public/images/'});

// Registrazione
router.get('/register', (req, res) => {
    res.render('register', { title: 'Registrati', errorMessage: null });
});

router.post('/register', (req, res) => {
    const {username, password, confirmPassword} = req.body;

    if (password !== confirmPassword) {
        return res.render('register', { title: 'Registrazione', errorMessage: 'Le password non corrispondono.' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.execute(query, [username, hashedPassword], (err, results) => {
            if (err) throw err;
            res.redirect('/login'); // Dopo la registrazione redirect
        })
    })
})

// Login
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login', errorMessage: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM user WHERE username = ?'
    db.execute(query, [username], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.render('login', { title: 'Login', errorMessage: 'Nome utente non trovato.' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) throw err;

            if (match) {
                // Autenticazione avvenuta con successo
                req.session.userId = user.id; // Salva l'ID utente nella sessione
                return res.redirect('/'); // Reindirizza alla homepage
            } else {
                return res.render('login', { title: 'Login', errorMessage: 'Password errata.' });
            }
        });
    });
});





module.exports = (db) => {
    return router;
};
