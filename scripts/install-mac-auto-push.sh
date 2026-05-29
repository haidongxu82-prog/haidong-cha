#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/haidong/Documents/Codex/2026-05-29/https-haidong-chat-ai-ai"
SCRIPT_PATH="$REPO_DIR/scripts/auto-push-site.sh"
PLIST_PATH="$HOME/Library/LaunchAgents/chat.haidong.site-auto-push.plist"
LOG_FILE="$HOME/Library/Logs/haidong-site-auto-push.log"

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Cannot find $SCRIPT_PATH" >&2
  exit 1
fi

chmod +x "$SCRIPT_PATH"
mkdir -p "$HOME/Library/LaunchAgents" "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>chat.haidong.site-auto-push</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT_PATH</string>
  </array>
  <key>StartInterval</key>
  <integer>180</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_FILE</string>
  <key>StandardErrorPath</key>
  <string>$LOG_FILE</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

"$SCRIPT_PATH" || true

echo "Mac auto-push installed."
echo "It checks every 3 minutes."
echo "Log: $LOG_FILE"
