from __future__ import annotations

from collections import Counter


def detect_trends(products: list[dict]) -> dict:
    style_counter = Counter(item.get("image_style", "unknown") for item in products)
    category_counter = Counter(item.get("category", "unknown") for item in products)
    hot_styles = Counter(item.get("image_style", "unknown") for item in products if item.get("is_hot"))
    return {
        "dominant_image_styles": dict(style_counter.most_common()),
        "dominant_categories": dict(category_counter.most_common()),
        "hot_product_image_styles": dict(hot_styles.most_common()),
    }
