# --- Этап 1: установка зависимостей ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# --- Этап 2: финальный production-образ ---
FROM node:20-alpine AS runner
WORKDIR /app

# Непривилегированный пользователь — контейнер не должен работать от root
RUN addgroup -S forum && adduser -S forum -G forum

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY migrations ./migrations

USER forum

ENV NODE_ENV=production
EXPOSE 3000

# Docker сам перезапустит контейнер, если health-check начнёт падать
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/app.js"]
