from __future__ import annotations

from collections import Counter
from datetime import datetime

from processor.price_band import price_band_analysis


def analyze_shop_structure(products: list[dict]) -> dict:
    total = len(products)
    if total == 0:
        return {
            "爆款占比": 0,
            "SKU结构": {},
            "价格带分布": {},
            "上新频率": "unknown",
        }

    hot_count = sum(1 for item in products if item.get("is_hot"))
    sku_distribution = dict(Counter(item.get("sku_type", "unknown") for item in products))
    publish_frequency = calculate_publish_frequency(products)

    return {
        "爆款占比": round(hot_count / total, 4),
        "SKU结构": sku_distribution,
        "价格带分布": price_band_analysis(products),
        "上新频率": publish_frequency,
        "商品数": total,
        "总销量": sum(item["sales"] for item in products),
        "均价": round(sum(item["price"] for item in products) / total, 2),
    }


def calculate_publish_frequency(products: list[dict]) -> str:
    dates = []
    for item in products:
        raw = item.get("publish_time")
        if not raw:
            continue
        try:
            dates.append(datetime.fromisoformat(raw))
        except ValueError:
            continue
    if len(dates) < 2:
        return "insufficient_data"
    days = max((max(dates) - min(dates)).days, 1)
    freq = len(dates) / days
    if freq >= 1:
        return "高频上新"
    if freq >= 0.35:
        return "稳定上新"
    return "低频上新"
