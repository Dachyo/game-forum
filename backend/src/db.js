const { Pool } = require('pg');

// Параметры подключения берутся из переменных окружения,
// которые задаются в docker-compose.yml / .env
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'forum',
  password: process.env.DB_PASSWORD || 'forum',
  database: process.env.DB_NAME || 'forum',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Неожиданная ошибка подключения к БД:', err);
});

module.exports = pool;
