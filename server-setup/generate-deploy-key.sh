#!/usr/bin/env bash
# Запускать на ЛОКАЛЬНОЙ машине (твой Mac), не на сервере.
# Генерирует пару SSH-ключей специально для GitHub Actions.

set -euo pipefail

KEY_PATH="$HOME/.ssh/github_actions_deploy"

if [ -f "$KEY_PATH" ]; then
  echo "Ключ уже существует: $KEY_PATH"
else
  ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "github-actions-deploy"
  echo "Ключ создан: $KEY_PATH"
fi

echo
echo "===== ШАГ 1: скопируй публичный ключ на сервер ====="
echo "ssh-copy-id -i ${KEY_PATH}.pub deploy@<IP_СЕРВЕРА>"
echo "(или вручную добавь содержимое ${KEY_PATH}.pub в /home/deploy/.ssh/authorized_keys на сервере)"
echo
echo "===== ШАГ 2: добавь секреты в GitHub репозиторий ====="
echo "Settings -> Secrets and variables -> Actions -> New repository secret:"
echo
echo "  SSH_HOST          = IP-адрес твоего сервера"
echo "  SSH_USER           = deploy"
echo "  SSH_PORT           = 22"
echo "  SSH_PRIVATE_KEY     = содержимое файла ${KEY_PATH} (приватный ключ целиком)"
echo "  DEPLOY_PATH         = /opt/game-forum"
echo "  DB_USER             = forum"
echo "  DB_PASSWORD         = (придумай надёжный пароль)"
echo "  DB_NAME              = forum"
echo "  SESSION_SECRET       = (длинная случайная строка)"
echo
echo "Приватный ключ можно вывести командой:"
echo "  cat ${KEY_PATH}"
