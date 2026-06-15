from __future__ import annotations


def rule_based_pricing_insight(payload: dict) -> dict:
    market_avg = payload["market_price"]["avg"]
    suggest = payload["pricing"]["suggest_price"]
    min_price = payload["pricing"]["min_price"]
    sales = payload.get("sales") or {}
    conversion_rate = float(sales.get("conversion_rate", 0) or 0)

    if suggest < market_avg * 0.96:
        direction = "up"
        reason = "建议价低于市场均价，且仍满足成本毛利约束，可适度上调以提升毛利。"
    elif suggest > market_avg * 1.08:
        direction = "down"
        reason = "建议价明显高于市场均价，需用品牌、材质或赠品证明溢价，否则建议下调。"
    else:
        direction = "hold"
        reason = "建议价接近市场均价，同时高于最低毛利价，适合作为主推价。"

    if conversion_rate < 0.04:
        promotion = f"可测试短期促销价，但不得低于最低毛利价 {min_price:.2f}。"
    elif direction == "up":
        promotion = "不建议立即促销，优先测试小幅提价。"
    else:
        promotion = "可保留促销价用于直播间限时转化。"

    return {
        "recommended_price": suggest,
        "price_direction": direction,
        "reason": reason,
        "promotion_suggestion": promotion,
    }
