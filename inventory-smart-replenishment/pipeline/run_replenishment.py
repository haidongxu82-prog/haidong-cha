from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from app.core.service import run_replenishment


OUTPUT_DIR = PROJECT_DIR / "output"


def run() -> dict[str, str]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    suggestions = run_replenishment()
    suggestions_path = OUTPUT_DIR / "replenishment_suggestions.json"
    suggestions_path.write_text(json.dumps(suggestions, ensure_ascii=False, indent=2), encoding="utf-8")

    high_risk_items = [
        item for item in suggestions
        if item["priority"] in {"P0", "P1"} and item["recommended_qty"] > 0
    ]
    purchase_orders = [
        {
            "po_id": index + 1,
            "sku_id": item["sku_id"],
            "qty": item["recommended_qty"],
            "supplier_id": item["supplier_id"],
            "status": "draft",
        }
        for index, item in enumerate(high_risk_items)
    ]
    po_path = OUTPUT_DIR / "purchase_orders.json"
    po_path.write_text(json.dumps(purchase_orders, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "suggestions": str(suggestions_path),
        "purchase_orders": str(po_path),
    }


if __name__ == "__main__":
    print(run())
