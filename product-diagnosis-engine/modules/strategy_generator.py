from __future__ import annotations


def generate_strategy(input_data: dict, analysis: dict, profit: dict, score: int) -> dict:
    market = analysis["market_analysis"]
    market_avg = analysis["market_price"]["avg"]
    selling_price = float(input_data["selling_price"])

    if score >= 75:
        decision = "strong_buy"
        reason = "利润空间、需求信号和价格合理性整体较好，适合进入测试或放量。"
    elif score >= 55:
        decision = "try"
        reason = "具备测试价值，但需要控制库存和投放预算。"
    else:
        decision = "avoid"
        reason = "综合评分偏低，竞争、需求或利润存在明显短板。"

    risk_factors = []
    if profit["mid"] <= 0:
        risk_factors.append("中位利润为负")
    if market["competition_level"] == "high":
        risk_factors.append("竞品竞争强度高")
    if market["demand_signal"] == "weak":
        risk_factors.append("需求信号偏弱")
    if selling_price > market_avg * 1.2:
        risk_factors.append("售价明显高于竞品均价")

    suggestions = [
        build_pricing_suggestion(selling_price, market_avg),
        "主图突出核心卖点，避免只展示款式不展示穿着效果。",
        "投放关键词优先围绕类目词、场景词和人群词做小预算测试。",
    ]

    if "民族风" in input_data.get("optional_keywords", []) or "民族" in input_data.get("category", ""):
        suggestions.append("民族文化表达要避免唯一、正宗、官方认证等绝对化话术。")

    return {
        "decision": decision,
        "reason": reason,
        "risk_factors": risk_factors,
        "optimization_suggestions": suggestions,
    }


def build_pricing_suggestion(selling_price: float, market_avg: float) -> str:
    if market_avg <= 0:
        return "竞品均价不足，先补充竞品样本后再定价。"
    if selling_price > market_avg * 1.1:
        return "当前售价高于竞品均价，需强化材质、工艺或赠品证明溢价。"
    if selling_price < market_avg * 0.9:
        return "当前售价低于竞品均价，可作为引流价测试，但需控制毛利。"
    return "当前售价接近竞品均价，可作为主推测试价。"
