from __future__ import annotations


def analyze_competitors(competitors: list[dict]) -> dict:
    prices = [float(item["price"]) for item in competitors if item.get("price")]
    ratings = [float(item["rating"]) for item in competitors if item.get("rating")]
    sales_levels = [item.get("sales_level", "medium") for item in competitors]

    avg_price = sum(prices) / len(prices) if prices else 0
    rating_avg = sum(ratings) / len(ratings) if ratings else 0
    high_sales_count = sum(1 for level in sales_levels if level == "high")

    if len(competitors) >= 5 and high_sales_count >= 2:
        competition_level = "high"
    elif len(competitors) >= 3:
        competition_level = "medium"
    else:
        competition_level = "low"

    if avg_price < 80:
        price_band = "低"
    elif avg_price < 180:
        price_band = "中"
    else:
        price_band = "高"

    if high_sales_count >= 2 and rating_avg >= 4.6:
        demand_signal = "strong"
    elif rating_avg >= 4.3:
        demand_signal = "medium"
    else:
        demand_signal = "weak"

    return {
        "market_price": {
            "min": round(min(prices), 2) if prices else 0,
            "max": round(max(prices), 2) if prices else 0,
            "avg": round(avg_price, 2),
        },
        "market_analysis": {
            "competition_level": competition_level,
            "price_band": price_band,
            "demand_signal": demand_signal,
            "review_pain_points": infer_pain_points(competitors),
            "main_selling_points": infer_selling_points(competitors),
        }
    }


def infer_pain_points(competitors: list[dict]) -> list[str]:
    text = " ".join(item.get("title", "") for item in competitors)
    points = []
    if "显瘦" in text:
        points.append("用户关注版型显瘦")
    if "舒适" in text or "宽松" in text:
        points.append("用户关注穿着舒适度")
    if "刺绣" in text or "民族" in text:
        points.append("用户关注民族元素是否精致")
    return points or ["需进一步采集评价文本确认痛点"]


def infer_selling_points(competitors: list[dict]) -> list[str]:
    text = " ".join(item.get("title", "") for item in competitors)
    points = []
    if "刺绣" in text:
        points.append("刺绣工艺")
    if "显瘦" in text:
        points.append("显瘦版型")
    if "妈妈装" in text:
        points.append("中老年适配")
    if "民族风" in text:
        points.append("民族风设计")
    return points or ["价格优势", "基础款适配"]
