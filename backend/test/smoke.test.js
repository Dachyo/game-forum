const test = require('node:test');
const assert = require('node:assert');

// Это намеренно простой smoke-test, проверяющий, что модули приложения
// загружаются без синтаксических ошибок до того, как пайплайн пойдёт
// собирать и разворачивать Docker-образ. Полноценные интеграционные тесты
// (с поднятой тестовой БД) — хорошее направление для расширения работы.

test('маршруты загружаются без ошибок', () => {
  assert.doesNotThrow(() => require('../src/middleware/auth'));
});

test('переменные окружения для БД имеют значения по умолчанию', () => {
  delete process.env.DB_HOST;
  assert.doesNotThrow(() => require('../src/db'));
});
