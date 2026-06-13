#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Please run with sudo: sudo bash scripts/install-server-home-sync.sh"
  exit 1
fi

REPO_DIR="/var/www/haidong-chat"
LIVE_DIR="/opt/haidong-home"
SYNC_BIN="/usr/local/bin/haidong-home-sync"
SERVICE_FILE="/etc/systemd/system/haidong-home-sync.service"
TIMER_FILE="/etc/systemd/system/haidong-home-sync.timer"
LOG_FILE="/var/log/haidong-home-sync.log"

install -d -m 755 "$LIVE_DIR"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

cat > "$SYNC_BIN" <<'SYNC_SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/var/www/haidong-chat"
LIVE_DIR="/opt/haidong-home"
LOG_FILE="/var/log/haidong-home-sync.log"
LOCK_FILE="/var/lock/haidong-home-sync.lock"

mkdir -p "$(dirname "$LOCK_FILE")"

{
  flock -n 9 || exit 0

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] checking homepage sync"

  if [ ! -d "$REPO_DIR/.git" ]; then
    echo "repo missing: $REPO_DIR"
    exit 1
  fi

  git config --global --add safe.directory "$REPO_DIR" >/dev/null 2>&1 || true

  cd "$REPO_DIR"
  before="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  git fetch origin main
  git reset --hard origin/main
  after="$(git rev-parse HEAD 2>/dev/null || echo unknown)"

  rsync -a --delete \
    --exclude='.git' \
    --exclude='.DS_Store' \
    "$REPO_DIR/" "$LIVE_DIR/"

  if [ "$before" != "$after" ]; then
    echo "updated homepage: $before -> $after"
  else
    echo "homepage already current: $after"
  fi
} 9>"$LOCK_FILE" >> "$LOG_FILE" 2>&1
SYNC_SCRIPT

chmod 755 "$SYNC_BIN"

cat > "$SERVICE_FILE" <<'SERVICE'
[Unit]
Description=Sync haidong.chat homepage from GitHub checkout to live directory
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/haidong-home-sync
SERVICE

cat > "$TIMER_FILE" <<'TIMER'
[Unit]
Description=Run haidong.chat homepage sync every minute

[Timer]
OnBootSec=30s
OnUnitActiveSec=1min
AccuracySec=10s
Persistent=true

[Install]
WantedBy=timers.target
TIMER

systemctl daemon-reload
systemctl enable --now haidong-home-sync.timer
systemctl start haidong-home-sync.service

echo "Homepage auto-sync installed."
echo "Timer: haidong-home-sync.timer"
echo "Log: $LOG_FILE"
echo "Manual run: sudo systemctl start haidong-home-sync.service"
