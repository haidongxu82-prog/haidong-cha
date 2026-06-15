from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class MarketPrice:
    min: float
    max: float
    avg: float
    sample_count: int
    filtered_count: int

    def to_dict(self) -> dict:
        return {
            "min": round(self.min, 2),
            "max": round(self.max, 2),
            "avg": round(self.avg, 2),
            "sample_count": self.sample_count,
            "filtered_count": self.filtered_count,
        }


def filter_price_outliers(prices: list[float], low_q: float = 0.05, high_q: float = 0.95) -> list[float]:
    valid = [float(price) for price in prices if price and float(price) > 0]
    if len(valid) < 4:
        return valid

    series = pd.Series(valid)
    low = series.quantile(low_q)
    high = series.quantile(high_q)
    filtered = series[(series >= low) & (series <= high)].tolist()
    return filtered or valid


def calc_market_price(competitors: list[dict], low_q: float = 0.05, high_q: float = 0.95) -> MarketPrice:
    prices = [float(c["price"]) for c in competitors if c.get("price") and float(c["price"]) > 0]
    if not prices:
        raise ValueError("competitor prices cannot be empty")

    filtered = filter_price_outliers(prices, low_q, high_q)
    return MarketPrice(
        min=min(filtered),
        max=max(filtered),
        avg=sum(filtered) / len(filtered),
        sample_count=len(prices),
        filtered_count=len(filtered),
    )
