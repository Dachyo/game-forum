const test = require('node:test');
const assert = require('node:assert');

test('маршруты загружаются без ошибок', () => {
  assert.doesNotThrow(() => require('../src/middleware/auth'));
});

test('переменные окружения для БД имеют значения по умолчанию', () => {
  delete process.env.DB_HOST;
  assert.doesNotThrow(() => require('../src/db'));
});
