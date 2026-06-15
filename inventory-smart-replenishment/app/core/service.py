from __future__ import annotations

from app.ai.explainer import rule_based_ai_enhancement
from app.core.replenishment_engine import generate_suggestion
from app.data.loaders import aggregate_current_stock, load_inventory_stock, load_product_sku, load_sales_daily, sales_trend_by_sku


def run_replenishment() -> list[dict]:
    sku_df = load_product_sku()
    stock_df = aggregate_current_stock(load_inventory_stock())
    sales_trends = sales_trend_by_sku(load_sales_daily())
    merged = sku_df.merge(stock_df, on="sku_id", how="left")
    merged["current_stock"] = merged["current_stock"].fillna(0).astype(int)

    suggestions = []
    for row in merged.to_dict(orient="records"):
        trend = sales_trends.get(row["sku_id"], [])
        suggestion = generate_suggestion(row, row["current_stock"], trend)
        suggestion["ai_recommendation"] = rule_based_ai_enhancement(suggestion, trend)
        suggestions.append(suggestion)
    return suggestions


def high_risk_suggestions() -> list[dict]:
    return [item for item in run_replenishment() if item["priority"] in {"P0", "P1"}]
