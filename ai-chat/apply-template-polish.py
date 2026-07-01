#!/usr/bin/env python3
import os
import re
from datetime import datetime
from pathlib import Path


TEMPLATE = Path(os.environ.get("AI_CHAT_TEMPLATE", "/opt/ai_chat/template.html"))
ROOT = Path(__file__).resolve().parents[1]
V2_DIR = ROOT / "ai-chat-v2"
INDEX = V2_DIR / "index.html"
STYLES = V2_DIR / "styles.css"
APP = V2_DIR / "app.js"
LOGO = ROOT / "assets" / "logo-hd-minimal.svg"


def read(path: Path) -> str:
    if not path.exists():
        raise SystemExit(f"missing file: {path}")
    return path.read_text(encoding="utf-8")


def build_template() -> str:
    html = read(INDEX)
    css = read(STYLES)
    js = read(APP)
    logo = read(LOGO).replace("<svg ", '<svg class="brand" aria-hidden="true" ')

    # html = html.replace('data-theme="light"', 'data-theme="dark"')  # 撤销强制深色，恢复浅色（之前的样子）
    html = html.replace("../index.html", "https://ai.haidong.chat/")
    html = re.sub(
        r'<img class="brand" src="\.\./assets/logo-hd-minimal\.svg" alt="HD">',
        logo,
        html,
        count=1,
    )

    html = re.sub(
        r'\s*<link rel="stylesheet" href="\./styles\.css">\s*',
        lambda _match: f"\n  <style>\n{css}\n  </style>\n",
        html,
        count=1,
    )
    html = re.sub(
        r'\s*<script src="\./app\.js"></script>\s*',
        lambda _match: f"\n  <script>\nwindow.__MODEL_DATA__ = MODEL_DATA_PLACEHOLDER;\n{js}\n  </script>\n",
        html,
        count=1,
    )
    return html


def main() -> None:
    if TEMPLATE.exists():
        backup = TEMPLATE.with_name(f"template.v2-clean-backup.{datetime.now():%Y%m%d%H%M%S}.html")
        backup.write_text(TEMPLATE.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        backup = None

    TEMPLATE.write_text(build_template(), encoding="utf-8")
    print("ai.haidong.chat clean V2 template written")
    if backup:
        print(f"backup: {backup}")


if __name__ == "__main__":
    main()
