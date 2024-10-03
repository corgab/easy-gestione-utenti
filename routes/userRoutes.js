const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('../models/db');
const router = express.Router();

// immagini profilo
const upload = multer({dest: 'public/images/'});

// Registrazione
router.post('/register', (req, res) => {
    const {username, password} = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.execute(query, [username, hashedPassword], (err, results) => {
            if (err) throw err;
            res.redirect('/login');
        })
    })
})



module.exports = (db) => {
    return router;
};
