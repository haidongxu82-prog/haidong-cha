from __future__ import annotations


def clean_data(raw_data: list[dict]) -> list[dict]:
    cleaned = []
    for item in raw_data:
        price = float(item.get("price") or 0)
        sales = int(float(item.get("sales") or 0))
        if not item.get("product_name") or price <= 0:
            continue
        cleaned.append({
            "product_name": str(item["product_name"]).strip(),
            "price": price,
            "sales": sales,
            "publish_time": item.get("publish_time") or "",
            "category": item.get("category") or "unknown",
            "image_url": item.get("image_url") or "",
            "image_style": item.get("image_style") or "unknown",
        })
    return cleaned
