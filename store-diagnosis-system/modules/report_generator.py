from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd


def records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return df.where(pd.notnull(df), None).to_dict(orient="records")


def build_payload(
    merged: pd.DataFrame,
    layer_summary: pd.DataFrame,
    ads_result: pd.DataFrame,
    ai_summary: dict,
) -> dict[str, Any]:
    product_layers = merged["product_layer"].value_counts().to_dict()
    pricing_flags = merged["pricing_flag"].value_counts().to_dict()
    ads_status = ads_result["ads_status"].value_counts().to_dict()

    return {
        "overview": {
            "sku_count": int(merged["sku"].nunique()),
            "sales_30d": int(merged["sales_30d"].sum()),
            "avg_ctr": round(float(merged["ctr"].mean()), 4),
            "avg_conversion_rate": round(float(merged["conversion_rate"].mean()), 4),
            "product_layers": product_layers,
            "pricing_flags": pricing_flags,
            "ads_status": ads_status,
        },
        "product_layer_summary": records(layer_summary),
        "sku_diagnosis": records(merged),
        "ads_analysis": records(ads_result),
        "ai_summary": ai_summary,
    }


def write_markdown(payload: dict[str, Any], path: Path) -> Path:
    overview = payload["overview"]
    lines = [
        "# 电商店铺诊断报告",
        "",
        "## 店铺健康度总览",
        f"- SKU数量：{overview['sku_count']}",
        f"- 30日销量：{overview['sales_30d']}",
        f"- 平均CTR：{overview['avg_ctr']:.2%}",
        f"- 平均转化率：{overview['avg_conversion_rate']:.2%}",
        f"- 商品分层：{overview['product_layers']}",
        f"- 定价风险：{overview['pricing_flags']}",
        f"- 广告状态：{overview['ads_status']}",
        "",
        "## 核心诊断",
    ]
    lines.extend([f"- {item}" for item in payload["ai_summary"]["diagnosis"]])
    lines.extend(["", "## 优化建议"])
    for action in payload["ai_summary"]["actions"]:
        lines.append(f"- {action['priority']}：{action['action']}（预期：{action['expected_impact']}）")
    lines.extend(["", "## 高风险SKU"])
    high_risk = [
        item for item in payload["sku_diagnosis"]
        if item.get("product_layer") == "C" or item.get("pricing_flag") != "正常" or item.get("ads_status") == "亏损"
    ]
    if not high_risk:
        lines.append("- 暂无")
    for item in high_risk:
        issues = item.get("visual_conversion_issues") or []
        lines.append(f"- {item['sku']} / {item['title']} / 层级={item['product_layer']} / 定价={item['pricing_flag']} / 广告={item.get('ads_status', '无投放')}")
        if issues:
            lines.append(f"  - 异常：{', '.join(issues)}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def write_excel(path: Path, **tables: pd.DataFrame) -> Path:
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        for name, table in tables.items():
            table.to_excel(writer, sheet_name=name[:31], index=False)
    return path
