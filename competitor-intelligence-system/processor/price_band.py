from __future__ import annotations


def price_band(price: float) -> str:
    if price < 30:
        return "0-30"
    if price < 60:
        return "30-60"
    if price < 100:
        return "60-100"
    return "100+"


def price_band_analysis(products: list[dict]) -> dict[str, int]:
    bands = {"0-30": 0, "30-60": 0, "60-100": 0, "100+": 0}
    for product in products:
        bands[price_band(product["price"])] += 1
    return bands
