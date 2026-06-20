const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Главная страница: список категорий + последние темы
router.get('/', async (req, res, next) => {
  try {
    const categories = await pool.query('SELECT * FROM categories ORDER BY name');
    const threads = await pool.query(`
      SELECT t.id, t.title, t.created_at, u.username, c.name AS category_name, c.slug,
             (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) AS post_count
      FROM threads t
      JOIN users u ON u.id = t.author_id
      JOIN categories c ON c.id = t.category_id
      ORDER BY t.created_at DESC
      LIMIT 20
    `);
    res.render('index', { categories: categories.rows, threads: threads.rows });
  } catch (err) {
    next(err);
  }
});

// Темы внутри одной категории
router.get('/category/:slug', async (req, res, next) => {
  try {
    const catResult = await pool.query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
    const category = catResult.rows[0];
    if (!category) return res.status(404).render('404');

    const threads = await pool.query(
      `SELECT t.id, t.title, t.created_at, u.username,
              (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) AS post_count
       FROM threads t
       JOIN users u ON u.id = t.author_id
       WHERE t.category_id = $1
       ORDER BY t.created_at DESC`,
      [category.id]
    );
    res.render('category', { category, threads: threads.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/threads/new', requireAuth, async (req, res, next) => {
  try {
    const categories = await pool.query('SELECT * FROM categories ORDER BY name');
    res.render('new-thread', { categories: categories.rows, error: null });
  } catch (err) {
    next(err);
  }
});

router.post('/threads/new', requireAuth, async (req, res, next) => {
  const { title, category_id, body } = req.body;
  if (!title || !category_id || !body) {
    const categories = await pool.query('SELECT * FROM categories ORDER BY name');
    return res.render('new-thread', { categories: categories.rows, error: 'Заполните все поля' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const threadResult = await client.query(
      'INSERT INTO threads (category_id, author_id, title) VALUES ($1, $2, $3) RETURNING id',
      [category_id, req.session.userId, title]
    );
    const threadId = threadResult.rows[0].id;
    await client.query(
      'INSERT INTO posts (thread_id, author_id, body) VALUES ($1, $2, $3)',
      [threadId, req.session.userId, body]
    );
    await client.query('COMMIT');
    res.redirect(`/threads/${threadId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.get('/threads/:id', async (req, res, next) => {
  try {
    const threadResult = await pool.query(
      `SELECT t.*, c.name AS category_name, c.slug
       FROM threads t JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    const thread = threadResult.rows[0];
    if (!thread) return res.status(404).render('404');

    const posts = await pool.query(
      `SELECT p.*, u.username FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.thread_id = $1
       ORDER BY p.created_at ASC`,
      [req.params.id]
    );
    res.render('thread', { thread, posts: posts.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/threads/:id/reply', requireAuth, async (req, res, next) => {
  const { body } = req.body;
  if (!body) return res.redirect(`/threads/${req.params.id}`);

  try {
    await pool.query(
      'INSERT INTO posts (thread_id, author_id, body) VALUES ($1, $2, $3)',
      [req.params.id, req.session.userId, body]
    );
    res.redirect(`/threads/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
