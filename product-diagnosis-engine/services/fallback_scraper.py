from __future__ import annotations


def fallback_competitors(input_data: dict, top_n: int = 5) -> list[dict]:
    product_name = input_data["product_name"]
    category = input_data["category"]
    price = float(input_data["selling_price"])
    keywords = input_data.get("optional_keywords") or [category]

    samples = [
        (0.86, "high", 4.8),
        (0.94, "medium", 4.6),
        (1.02, "high", 4.7),
        (1.12, "medium", 4.4),
        (1.24, "low", 4.2),
    ]

    items = []
    for index, (ratio, sales_level, rating) in enumerate(samples[:top_n], start=1):
        keyword = keywords[(index - 1) % len(keywords)]
        items.append({
            "title": f"{keyword}{product_name}竞品{index}",
            "price": round(price * ratio, 2),
            "sales_level": sales_level,
            "rating": rating,
            "url": f"https://example.com/{input_data.get('platform', 'mock')}/competitor-{index}",
        })
    return items
