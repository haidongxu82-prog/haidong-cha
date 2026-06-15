from __future__ import annotations

from competitor_classification.classifier import classify_competitor
from growth_score.scoring import calculate_growth_score


TARGET_CATEGORIES = {"民族服饰", "中老年女装", "女装"}


def analyze_store(record: dict) -> dict:
    metrics = record["metrics"]
    growth_score = calculate_growth_score(
        metrics["sales_index"],
        metrics["ad_index"],
        metrics["social_index"],
        record["first_seen_days"],
    )
    level = classify_competitor(growth_score)
    is_new_brand = record["first_seen_days"] <= 7 and (
        metrics["sales_index"] > 50 or metrics["ad_index"] > 50 or metrics["social_index"] > 50
    )
    is_competitor = record["category"] in TARGET_CATEGORIES and growth_score >= 45
    alert = growth_score > 80 or is_new_brand

    return {
        "is_new_brand": bool(is_new_brand),
        "is_competitor": bool(is_competitor),
        "competitor_level": level,
        "growth_score": growth_score,
        "alert": bool(alert),
        "reason": build_reason(record, growth_score, level, is_new_brand),
    }


def build_reason(record: dict, growth_score: float, level: str, is_new_brand: bool) -> str:
    metrics = record["metrics"]
    parts = []
    if is_new_brand:
        parts.append("7天内出现的新品牌")
    if metrics["ad_index"] >= 70:
        parts.append("广告投放强")
    if metrics["social_index"] >= 70:
        parts.append("社媒热度高")
    if metrics["sales_index"] >= 70:
        parts.append("销量指数高")
    parts.append(f"综合增长评分{growth_score}，竞品等级{level}")
    return "，".join(parts)
