from __future__ import annotations


def estimate_sales_level(sales: int) -> str:
    if sales >= 800:
        return "high"
    if sales >= 300:
        return "medium"
    return "low"


def append_sales_level(products: list[dict]) -> list[dict]:
    for product in products:
        product["sales_level"] = estimate_sales_level(product["sales"])
    return products
