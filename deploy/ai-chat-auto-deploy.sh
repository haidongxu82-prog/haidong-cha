#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-git@github.com:haidongxu82-prog/haidong-cha.git}"
BRANCH="${BRANCH:-main}"
CHECKOUT_DIR="${CHECKOUT_DIR:-/var/www/haidong-chat}"
APP_DIR="${APP_DIR:-/opt/ai_chat}"
STAMP_FILE="${STAMP_FILE:-/var/lib/haidong-ai-chat-deploy.last}"
PATCH_FILE="$CHECKOUT_DIR/ai-chat/apply-template-polish.py"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root." >&2
  exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  echo "App directory not found: $APP_DIR" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  apt-get update
  apt-get install -y git
fi

mkdir -p "$(dirname "$STAMP_FILE")"

if [ ! -d "$CHECKOUT_DIR/.git" ]; then
  rm -rf "$CHECKOUT_DIR"
  log "Cloning $REPO_URL"
  git clone --branch "$BRANCH" "$REPO_URL" "$CHECKOUT_DIR"
else
  log "Updating $CHECKOUT_DIR"
  git -C "$CHECKOUT_DIR" fetch origin "$BRANCH"
  git -C "$CHECKOUT_DIR" reset --hard "origin/$BRANCH"
fi

if [ ! -f "$PATCH_FILE" ]; then
  echo "Patch file not found: $PATCH_FILE" >&2
  exit 1
fi

current_commit="$(git -C "$CHECKOUT_DIR" rev-parse HEAD)"
current_patch_hash="$(sha256sum "$PATCH_FILE" | awk '{print $1}')"
current_state="$current_commit $current_patch_hash"
last_state=""
[ -f "$STAMP_FILE" ] && last_state="$(cat "$STAMP_FILE")"

if [ "$current_state" = "$last_state" ]; then
  log "No ai-chat changes to deploy."
  exit 0
fi

log "Applying ai-chat template polish"
python3 "$PATCH_FILE"

log "Restarting ai-chat.service"
systemctl restart ai-chat.service
systemctl is-active --quiet ai-chat.service

printf '%s\n' "$current_state" > "$STAMP_FILE"
log "Done. Deployed $current_commit"
