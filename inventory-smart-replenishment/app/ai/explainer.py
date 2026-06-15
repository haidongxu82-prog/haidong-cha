from __future__ import annotations


def build_llm_input(suggestion: dict, sales_trend_14d: list[int]) -> dict:
    return {
        "sku": suggestion["sku_id"],
        "sales_trend_14d": sales_trend_14d,
        "current_stock": suggestion["current_stock"],
        "avg_sales": suggestion["avg_sales"],
        "lead_time": suggestion["lead_time_days"],
    }


def rule_based_ai_enhancement(suggestion: dict, sales_trend_14d: list[int]) -> dict:
    trend_up = len(sales_trend_14d) >= 2 and sales_trend_14d[-1] > sales_trend_14d[0] * 1.2
    reason = suggestion["reason"]
    if trend_up and suggestion["priority"] in {"P0", "P1"}:
        reason += " 同时14天销量呈增长趋势，建议优先审批。"
    return {
        "recommend_qty": suggestion["recommended_qty"],
        "priority": suggestion["priority"],
        "reason": reason,
    }
