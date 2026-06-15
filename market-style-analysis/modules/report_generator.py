from pathlib import Path

import pandas as pd

from modules.io_utils import OUTPUT_DIR, write_json


def write_market_report(market_analysis):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    excel_path = OUTPUT_DIR / "market_style_report.xlsx"
    json_path = OUTPUT_DIR / "market_analysis.json"

    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        market_analysis["classified_market_data"].to_excel(writer, sheet_name="classified_market", index=False)
        market_analysis["style_analysis"].to_excel(writer, sheet_name="style_analysis", index=False)
        market_analysis["price_segment_analysis"].to_excel(writer, sheet_name="price_segment", index=False)
        market_analysis["category_style_analysis"].to_excel(writer, sheet_name="category_style", index=False)

    write_json(json_path, market_analysis["json"])
    return {"excel": str(excel_path), "json": str(json_path)}


def write_competitor_report(sku_classified, competitor_analysis):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    excel_path = OUTPUT_DIR / "sku_competitor_report.xlsx"
    json_path = OUTPUT_DIR / "competitor_analysis.json"

    flat_rows = []
    for sku_item in competitor_analysis:
        for competitor in sku_item["competitors"]:
            flat_rows.append(
                {
                    "sku_id": sku_item["sku_id"],
                    "sku_title": sku_item["title"],
                    "product_id": competitor["product_id"],
                    "competitor_title": competitor["title"],
                    "price": competitor["price"],
                    "style": competitor["style"],
                    "material": competitor["material"],
                    "similarity_score": competitor["similarity_score"],
                    "style_gap": competitor["style_gap"],
                    "price_gap": competitor["price_gap"],
                    "sales_volume": competitor["sales_volume"],
                    "gmv": competitor["gmv"],
                }
            )

    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        sku_classified.to_excel(writer, sheet_name="sku_classified", index=False)
        pd.DataFrame(flat_rows).to_excel(writer, sheet_name="competitors", index=False)
        pd.DataFrame(
            [
                {
                    "sku_id": item["sku_id"],
                    "title": item["title"],
                    "analysis": item["analysis"],
                    "competitor_count": len(item["competitors"]),
                }
                for item in competitor_analysis
            ]
        ).to_excel(writer, sheet_name="summary", index=False)

    write_json(json_path, competitor_analysis)
    return {"excel": str(excel_path), "json": str(json_path)}
