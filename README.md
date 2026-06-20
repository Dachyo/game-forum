# Автоматизация развёртывания и мониторинга веб-форума (игровой форум)

Проект-приложение к дипломной работе: контейнеризированный веб-форум +
автоматический CI/CD-конвейер, разворачивающий обновления на удалённый
сервер по SSH при каждом push в GitHub.

## Структура проекта

```
webforum/
├── backend/                 # Само приложение (Node.js/Express)
│   ├── src/
│   │   ├── app.js           # Точка входа, настройка Express и сессий
│   │   ├── db.js             # Пул подключений к PostgreSQL
│   │   ├── middleware/
│   │   │   └── auth.js       # Проверка авторизации
│   │   ├── routes/
│   │   │   ├── auth.js       # Регистрация/вход/выход
│   │   │   └── threads.js    # Темы и сообщения форума
│   │   ├── views/            # EJS-шаблоны (HTML)
│   │   └── public/css/       # Стили
│   ├── migrations/
│   │   └── 001_init.sql      # Схема БД, выполняется при первом старте контейнера
│   ├── test/
│   │   └── smoke.test.js     # Базовые тесты для CI
│   ├── Dockerfile             # Сборка production-образа приложения
│   ├── package.json
│   └── .env.example
├── docker-compose.yml        # Оркестрация: app + postgres
├── .env.example
├── .github/workflows/
│   └── deploy.yml             # CI/CD пайплайн (тест → сборка → деплой по SSH)
└── server-setup/
    ├── provision.sh            # Установка Docker на чистом Ubuntu Server
    └── generate-deploy-key.sh  # Генерация SSH-ключа для GitHub Actions
```

## Как это работает (для защиты)

Это ровно та схема, что нарисована на слайде 4 презентации:

```
Разработчик → git push → GitHub repository
                              │
                              ▼
                      GitHub Actions (CI/CD)
                  ┌─────────┴─────────┐
              job: test           job: build
           (npm test)          (docker build —
                                 проверка сборки)
                              │
                              ▼
                       job: deploy
              SSH-подключение к Ubuntu Server
                              │
                              ▼
              docker compose build && up -d
              (на сервере пересобираются и
               перезапускаются контейнеры)
                              │
                              ▼
                    curl /health — проверка,
                    что приложение реально живо
```

**Почему именно так:**

- **Docker** изолирует приложение от особенностей конкретной машины —
  и на твоём Mac, и на Ubuntu Server контейнер ведёт себя одинаково.
  Это прямой ответ на проблему "отсутствие единообразия сред" из слайда 4.
- **docker-compose.yml** описывает два сервиса (`app` и `db`) одной
  декларацией — поднимаются и обновляются вместе, одной командой.
- **GitHub Actions** — управляемый GitHub раннер, который реагирует на
  `push` в `main` и выполняет три последовательных job: `test` → `build` → `deploy`.
  Если тесты не прошли, деплой не запустится — это и есть "устойчивость
  процесса обновления к ошибкам" из требований к надёжности.
- **SSH** — защищённый канал, через который раннер GitHub Actions
  подключается к серверу и выполняет команды `docker compose`, без
  необходимости открывать сервер наружу чем-то ещё, кроме SSH-порта.
- **Health-check** (`/health` + `HEALTHCHECK` в Dockerfile + финальный
  `curl` в пайплайне) — три независимые точки проверки, что новая версия
  реально запустилась, прежде чем считать деплой успешным.

## Локальный запуск (для разработки и проверки перед защитой)

```bash
cp .env.example .env
docker compose up --build
```

Открой http://localhost:3000 — форум должен быть доступен,
база данных поднимется и заполнится начальными категориями автоматически.

Остановить:

```bash
docker compose down        # контейнеры остановлены, данные в volume сохранены
docker compose down -v     # + удалить volume с данными (полный сброс)
```

## Развёртывание на реальном сервере — пошагово

### 1. Подготовь Ubuntu Server

На самом сервере (через SSH под root или sudo-пользователем):

```bash
scp server-setup/provision.sh user@<IP_СЕРВЕРА>:~
ssh user@<IP_СЕРВЕРА>
sudo bash provision.sh
```

Скрипт поставит Docker Engine, плагин Docker Compose и создаст
пользователя `deploy`, от которого будет работать GitHub Actions.

### 2. Сгенерируй SSH-ключ для GitHub Actions

На своём Mac:

```bash
bash server-setup/generate-deploy-key.sh
```

Скрипт создаст пару ключей и распечатает, что добавить на сервер
и какие секреты завести в GitHub.

### 3. Создай репозиторий на GitHub и запушь проект

```bash
git init
git add .
git commit -m "Initial commit: Docker + CI/CD для игрового форума"
git branch -M main
git remote add origin git@github.com:<твой-логин>/game-forum.git
git push -u origin main
```

### 4. Добавь секреты в GitHub

`Settings → Secrets and variables → Actions → New repository secret`.
Полный список с пояснениями выводит `generate-deploy-key.sh` — это:
`SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`,
`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`.

### 5. Готово — пайплайн уже работает

Любой `git push` в `main` автоматически прогонит тесты, проверит
сборку Docker-образа и развернёт обновление на сервере. Прогресс
смотри во вкладке **Actions** репозитория на GitHub.

## Ручной деплой (без CI/CD, для сравнения / отладки)

Если нужно показать на защите, что происходит "под капотом" пайплайна,
то же самое можно выполнить руками прямо на сервере:

```bash
ssh deploy@<IP_СЕРВЕРА>
cd /opt/game-forum
docker compose build
docker compose up -d
docker compose logs -f app
```

## Возможные направления развития (для раздела "перспективы")

- Добавить мониторинг (Prometheus + Grafana или простой `cAdvisor`) —
  в презентации это заявлено в названии темы, но не реализовано в
  текущей версии кода; хорошая тема для дальнейшего развития проекта.
- Уведомления об ошибках деплоя в Telegram/Slack через GitHub Actions.
- Вынести статические файлы за Nginx/CDN.
- Добавить полноценные интеграционные тесты с тестовой БД в CI.
