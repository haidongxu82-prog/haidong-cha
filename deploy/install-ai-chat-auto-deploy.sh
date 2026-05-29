#!/usr/bin/env bash
set -euo pipefail

INSTALL_PATH="/usr/local/bin/haidong-ai-chat-deploy"
LOG_PATH="/var/log/haidong-ai-chat-deploy.log"
CRON_PATH="/etc/cron.d/haidong-ai-chat-deploy"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root." >&2
  exit 1
fi

CHECKOUT_DIR="/var/www/haidong-chat"

if [ ! -f "$CHECKOUT_DIR/deploy/ai-chat-auto-deploy.sh" ]; then
  if [ ! -d "$CHECKOUT_DIR/.git" ]; then
    mkdir -p "$CHECKOUT_DIR"
    git clone --branch main git@github.com:haidongxu82-prog/haidong-cha.git "$CHECKOUT_DIR"
  else
    git -C "$CHECKOUT_DIR" fetch origin main
    git -C "$CHECKOUT_DIR" reset --hard origin/main
  fi
fi

install -m 755 "$CHECKOUT_DIR/deploy/ai-chat-auto-deploy.sh" "$INSTALL_PATH"
touch "$LOG_PATH"

cat > "$CRON_PATH" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
*/5 * * * * root $INSTALL_PATH >> $LOG_PATH 2>&1
EOF

"$INSTALL_PATH" | tee -a "$LOG_PATH"

echo "Installed ai.haidong.chat auto deploy."
echo "Cron: $CRON_PATH"
echo "Log: $LOG_PATH"
