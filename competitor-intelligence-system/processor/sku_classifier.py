from __future__ import annotations


def classify_sku(price: float, sales_rank: int) -> str:
    if sales_rank <= 10:
        return "爆款"
    if price < 30:
        return "引流款"
    if price > 80:
        return "利润款"
    return "测试款"


def classify_products(products: list[dict]) -> list[dict]:
    ranked = sorted(products, key=lambda item: item["sales"], reverse=True)
    for index, item in enumerate(ranked, start=1):
        item["sales_rank"] = index
        item["is_hot"] = index <= 10
        item["sku_type"] = classify_sku(item["price"], index)
    return ranked
