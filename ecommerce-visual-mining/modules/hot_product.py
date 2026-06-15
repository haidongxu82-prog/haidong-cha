from __future__ import annotations

from collections import Counter

from config import HOT_SCORE_WEIGHTS


def identify_hot_products(shops: list[dict], top_n: int = 20) -> list[dict]:
    all_products = []
    title_counter = Counter()
    for shop in shops:
        for product in shop["products"]:
            normalized = normalize_title(product["title"])
            title_counter[normalized] += 1
            all_products.append({**product, "shop_id": shop["shop_id"], "normalized_title": normalized})

    max_sales = max((p["sales"] for p in all_products), default=1)
    max_engagement = max((p["likes"] + p["comments"] for p in all_products), default=1)

    scored = []
    for product in all_products:
        sales_score = product["sales"] / max_sales if max_sales else 0
        engagement_score = (product["likes"] + product["comments"]) / max_engagement if max_engagement else 0
        clarity_score = product.get("visual_clarity_score", 0.7)
        repetition_score = 1 if title_counter[product["normalized_title"]] > 1 else 0
        hot_score = (
            HOT_SCORE_WEIGHTS["sales_rank"] * sales_score
            + HOT_SCORE_WEIGHTS["engagement"] * engagement_score
            + HOT_SCORE_WEIGHTS["visual_clarity"] * clarity_score
            + HOT_SCORE_WEIGHTS["repetition"] * repetition_score
        ) * 100
        scored.append({
            "product_name": product["title"],
            "shop_id": product["shop_id"],
            "price": product["price"],
            "hot_score": round(hot_score, 2),
            "reason": build_hot_reason(sales_score, engagement_score, clarity_score, repetition_score),
            "signals": {
                "sales": product["sales"],
                "engagement": product["likes"] + product["comments"],
                "appears_in_multiple_shops": repetition_score == 1,
                "visual_clarity_score": clarity_score,
            },
            "image_urls": product.get("image_urls", []),
            "detail_images": product.get("detail_images", []),
        })

    return sorted(scored, key=lambda x: x["hot_score"], reverse=True)[:top_n]


def normalize_title(title: str) -> str:
    tokens = ["爆款", "新款", "2026", "夏季", "春夏", "女装"]
    result = title
    for token in tokens:
        result = result.replace(token, "")
    return result.strip()[:16]


def build_hot_reason(sales_score: float, engagement_score: float, clarity_score: float, repetition_score: int) -> str:
    reasons = []
    if sales_score >= 0.75:
        reasons.append("销量信号强")
    if engagement_score >= 0.65:
        reasons.append("互动表现好")
    if clarity_score >= 0.8:
        reasons.append("主图清晰度高")
    if repetition_score:
        reasons.append("多店重复出现")
    return " + ".join(reasons) or "综合表现中等，适合继续观察"
