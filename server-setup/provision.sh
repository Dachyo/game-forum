#!/usr/bin/env bash
# Запускается ОДИН РАЗ на чистом Ubuntu Server, от пользователя с sudo.
# Использование: sudo bash provision.sh
#
# Что делает:
#   1. Устанавливает Docker Engine + плагин Docker Compose
#   2. Создаёт отдельного пользователя deploy для GitHub Actions
#   3. Добавляет его в группу docker (чтобы не требовался sudo для docker-команд)
#   4. Готовит каталог проекта

set -euo pipefail

DEPLOY_USER="deploy"
DEPLOY_PATH="/opt/game-forum"

echo "== Обновление пакетов =="
apt-get update -y
apt-get upgrade -y

echo "== Установка зависимостей =="
apt-get install -y ca-certificates curl gnupg

echo "== Установка Docker Engine (официальный репозиторий) =="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "== Создание пользователя для деплоя =="
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

echo "== Подготовка каталога проекта =="
mkdir -p "$DEPLOY_PATH"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$DEPLOY_PATH"

echo "== Готово =="
echo "Сервер настроен. Дальше:"
echo "1. Сгенерируй SSH-ключ для GitHub Actions (см. generate-deploy-key.sh)"
echo "2. Добавь публичный ключ в /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "3. Добавь приватный ключ и параметры в секреты GitHub-репозитория"
