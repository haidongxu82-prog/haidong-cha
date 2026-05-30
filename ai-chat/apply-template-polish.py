#!/usr/bin/env python3
from datetime import datetime
from pathlib import Path


TEMPLATE = Path("/opt/ai_chat/template.html")
ORIGINAL_TEMPLATE = Path(__file__).resolve().parent / "original-template.html"


def main() -> None:
    if not ORIGINAL_TEMPLATE.exists():
        raise SystemExit(f"original template not found: {ORIGINAL_TEMPLATE}")

    if TEMPLATE.exists():
        backup = TEMPLATE.with_name(f"template.restore-backup.{datetime.now():%Y%m%d%H%M%S}.html")
        backup.write_text(TEMPLATE.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        backup = None

    TEMPLATE.write_text(ORIGINAL_TEMPLATE.read_text(encoding="utf-8"), encoding="utf-8")
    print("ai.haidong.chat template restored")
    if backup:
        print(f"backup: {backup}")


if __name__ == "__main__":
    main()
