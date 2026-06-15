from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from core.service import build_pricing_suggestion
from data.sku_loader import load_sku_base


OUTPUT_DIR = PROJECT_DIR / "output"


def run() -> dict[str, str]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sku_df = load_sku_base()
    results = [build_pricing_suggestion(sku_id) for sku_id in sku_df["sku_id"]]

    json_path = OUTPUT_DIR / "pricing_report.json"
    json_path.write_text(json.dumps({"items": results}, ensure_ascii=False, indent=2), encoding="utf-8")

    rows = []
    for item in results:
        rows.append({
            "sku_id": item["sku_id"],
            "product_name": item["product_name"],
            "cost_price": item["cost_price"],
            "market_min": item["market_price"]["min"],
            "market_avg": item["market_price"]["avg"],
            "market_max": item["market_price"]["max"],
            "min_price": item["pricing"]["min_price"],
            "suggest_price": item["pricing"]["suggest_price"],
            "max_price": item["pricing"]["max_price"],
            "promotion_price": item["pricing"]["promotion_price"],
            "price_band": item["pricing"]["price_band"],
            "margin_rate": item["pricing"]["margin_rate"],
            "direction": item["ai_insight"]["price_direction"],
            "reason": item["ai_insight"]["reason"],
            "promotion_suggestion": item["ai_insight"]["promotion_suggestion"],
        })

    excel_path = OUTPUT_DIR / "pricing_report.xlsx"
    pd.DataFrame(rows).to_excel(excel_path, index=False)
    return {"json": str(json_path), "excel": str(excel_path)}


if __name__ == "__main__":
    print(run())
