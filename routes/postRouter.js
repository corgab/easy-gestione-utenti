const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Nuovo post
router.get('/posts/create', (req, res) => {
  const userId = req.body.userId || req.cookies.userId;
  res.render('posts/create', {
    title: 'Crea un Post',
    userId,
    errorMessage: null,
  });
});

router.post('/create', (req, res) => {
  const { userId, content } = req.body;

  if (!content) {
    return res.render('posts/create', {
      title: 'Crea un Post',
      errorMessage: 'Il post non può essere vuoto',
    });
  }

  const query = 'INSERT INTO posts (user_id, content) VALUES (?, ?)';
  db.execute(query, [userId, content], (err, results) => {
    if (err) throw err;
    res.redirect(`/posts`);
  });
});

// Mostra tutti i post per utente
router.get('/posts', (req, res) => {
  const userId = req.body.userId || req.cookies.userId;

  const query =
    'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC';
  db.execute(query, [userId], (err, results) => {
    if (err) throw err;

    res.render('posts/index', {
      title: 'I tuoi post',
      posts: results,
      userId,
      errorMessage: null,
    });
  });
});

// Exporta il router
module.exports = (db) => {
  return router;
};
