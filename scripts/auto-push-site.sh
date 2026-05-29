#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/haidong/Documents/Codex/2026-05-29/https-haidong-chat-ai-ai"
LOG_FILE="$HOME/Library/Logs/haidong-site-auto-push.log"
LOCK_DIR="/tmp/haidong-site-auto-push.lock"
BRANCH="main"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG_FILE"
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "Another auto-push is running. Skip."
  exit 0
fi
trap 'rmdir "$LOCK_DIR"' EXIT

cd "$REPO_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "Not a git repository: $REPO_DIR"
  exit 1
fi

git rm --cached -r --ignore-unmatch \
  __pycache__ \
  ai-chat/__pycache__ \
  >/dev/null 2>> "$LOG_FILE" || true

git add \
  .gitignore \
  index.html \
  styles.css \
  CNAME \
  assets \
  posts \
  ai-chat \
  deploy \
  scripts \
  ':(exclude)__pycache__' \
  ':(exclude)ai-chat/__pycache__' \
  ':(exclude)**/.DS_Store' \
  ':(exclude)**/*.pyc' \
  ':(exclude)**/*.pyo' \
  2>> "$LOG_FILE" || true

if git diff --cached --quiet; then
  log "No site changes to push."
  exit 0
fi

commit_msg="Auto update site $(date '+%Y-%m-%d %H:%M')"
git commit -m "$commit_msg" >> "$LOG_FILE" 2>&1

if git push origin "$BRANCH" >> "$LOG_FILE" 2>&1; then
  log "Pushed: $commit_msg"
else
  log "Push failed. Manual check needed."
  exit 1
fi
