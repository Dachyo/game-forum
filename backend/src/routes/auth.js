const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6) {
    return res.render('register', {
      error: 'Имя пользователя обязательно, пароль — минимум 6 символов',
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    req.session.userId = result.rows[0].id;
    req.session.username = result.rows[0].username;
    res.redirect('/');
  } catch (err) {
    if (err.code === '23505') {
      return res.render('register', { error: 'Это имя уже занято' });
    }
    console.error(err);
    res.render('register', { error: 'Ошибка регистрации, попробуйте ещё раз' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.render('login', { error: 'Неверный логин или пароль' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Ошибка входа, попробуйте ещё раз' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
