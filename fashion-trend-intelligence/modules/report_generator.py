import pandas as pd

from modules.io_utils import OUTPUT_DIR, write_json


def write_database_schema():
    schema = """
CREATE TABLE products (
  product_id TEXT PRIMARY KEY,
  title TEXT,
  platform TEXT,
  price NUMERIC,
  sales_volume INTEGER,
  likes INTEGER,
  comments INTEGER,
  image_urls TEXT,
  crawl_time TIMESTAMP
);

CREATE TABLE ai_tags (
  product_id TEXT,
  style TEXT,
  fabric TEXT,
  design_elements TEXT,
  fashion_style TEXT,
  season TEXT,
  gender TEXT
);

CREATE TABLE hot_score (
  product_id TEXT,
  hot_score NUMERIC,
  level TEXT,
  trend_stage TEXT,
  calculated_time TIMESTAMP
);
""".strip()
    path = OUTPUT_DIR / "database_schema.sql"
    path.write_text(schema, encoding="utf-8")
    return path


def write_weekly_report(scored_df, trend):
    top = scored_df.head(10)
    lines = [
        "# Fashion Trend Weekly Report",
        "",
        "## Summary",
        f"- TOP商品数：{len(top)}",
        f"- 重点面料：{', '.join(trend['top_fabrics'])}",
        f"- 重点风格：{', '.join(trend['top_styles'])}",
        "",
        "## Top Trending Products",
    ]
    for _, row in top.iterrows():
        lines.append(
            f"- {row['product_id']}｜{row['title']}｜score {row['hot_score']}｜{row['level']}｜{row['trend_stage']}"
        )
    lines.extend(
        [
            "",
            "## Fabric Trend Analysis",
            f"- {', '.join(trend['top_fabrics'])}",
            "",
            "## Style Evolution Map",
            f"- {', '.join(trend['top_styles'])}",
            "",
            "## Emerging Opportunities",
            f"- {', '.join(trend['emerging_trends']) or '暂无'}",
            "",
            "## Declining Categories",
            f"- {', '.join(trend['declining_trends']) or '暂无'}",
        ]
    )
    path = OUTPUT_DIR / "weekly_report.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_outputs(scored_df, trend, config):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    excel_path = OUTPUT_DIR / "trending_products.xlsx"
    json_path = OUTPUT_DIR / "trend_analysis.json"

    top_n = config.get("top_n", 20)
    with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
        scored_df.head(top_n).to_excel(writer, sheet_name="top_trending", index=False)
        scored_df.to_excel(writer, sheet_name="all_products", index=False)
        pd.DataFrame([trend]).to_excel(writer, sheet_name="trend_summary", index=False)

    payload = {
        "top_products": scored_df.head(top_n).to_dict("records"),
        "trend_analysis": trend,
    }
    write_json(json_path, payload)
    report_path = write_weekly_report(scored_df, trend)
    schema_path = write_database_schema()
    return {
        "excel": str(excel_path),
        "json": str(json_path),
        "report": str(report_path),
        "schema": str(schema_path),
    }
