-- Схема базы данных форума
-- Выполняется автоматически при первом запуске контейнера postgres
-- (Postgres-образ исполняет всё из /docker-entrypoint-initdb.d при пустом volume)

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(100) UNIQUE NOT NULL,
    slug  VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS threads (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id         SERIAL PRIMARY KEY,
    thread_id  INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);

INSERT INTO categories (name, slug) VALUES
    ('Шутеры', 'shooters'),
    ('RPG', 'rpg'),
    ('Стратегии', 'strategy'),
    ('Инди', 'indie')
ON CONFLICT (slug) DO NOTHING;
