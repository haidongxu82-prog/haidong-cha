from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from app.core.service import generate_detail_page


OUTPUT_DIR = PROJECT_DIR / "output"


def run() -> dict[str, str]:
    product = json.loads((PROJECT_DIR / "data" / "sample_product.json").read_text(encoding="utf-8"))
    result = generate_detail_page(product)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUTPUT_DIR / "detail_page.json"
    html_path = OUTPUT_DIR / "detail_page.html"
    json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    html_path.write_text(result["html"], encoding="utf-8")
    return {"json": str(json_path), "html": str(html_path)}


if __name__ == "__main__":
    print(run())
