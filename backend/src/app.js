require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const pool = require('./db');
const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/threads');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 дней
  })
);

app.use(attachUser);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/', authRoutes);
app.use('/', threadRoutes);

app.use((req, res) => res.status(404).render('404'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500');
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
