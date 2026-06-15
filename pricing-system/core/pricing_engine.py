from __future__ import annotations

from dataclasses import dataclass

from .market_calc import MarketPrice


@dataclass(frozen=True)
class PricingResult:
    min_price: float
    suggest_price: float
    max_price: float
    promotion_price: float
    price_band: str
    margin_rate: float

    def to_dict(self) -> dict:
        return {
            "min_price": round(self.min_price, 2),
            "suggest_price": round(self.suggest_price, 2),
            "max_price": round(self.max_price, 2),
            "promotion_price": round(self.promotion_price, 2),
            "price_band": self.price_band,
            "margin_rate": round(self.margin_rate, 4),
        }


def validate_cost_price(cost_price: float) -> None:
    if cost_price <= 0:
        raise ValueError("cost_price must be greater than 0")


def calc_min_price(cost_price: float, min_margin: float = 0.2) -> float:
    validate_cost_price(cost_price)
    if min_margin <= 0 or min_margin >= 1:
        raise ValueError("min_margin must be between 0 and 1")
    return cost_price / (1 - min_margin)


def round_price(price: float, step: int = 1) -> float:
    if step <= 0:
        return round(price, 2)
    return round(round(price / step) * step, 2)


def classify_price_band(suggest_price: float, market: MarketPrice) -> str:
    if suggest_price <= market.min:
        return "low"
    if suggest_price >= market.max:
        return "high"
    return "mid"


def calc_promotion_price(cost_price: float, suggest_price: float, promotion_margin: float = 0.12) -> float:
    floor = calc_min_price(cost_price, promotion_margin)
    promo = min(suggest_price * 0.92, suggest_price - 5)
    return max(floor, promo)


def suggest_price(
    cost_price: float,
    market: MarketPrice,
    min_margin: float = 0.2,
    promotion_margin: float = 0.12,
    round_step: int = 1,
) -> PricingResult:
    min_price = calc_min_price(cost_price, min_margin)
    target_price = market.avg

    if target_price < min_price:
        target_price = min_price * 1.05

    suggest = round_price(target_price, round_step)
    max_price = max(market.max, suggest)
    promotion = round_price(calc_promotion_price(cost_price, suggest, promotion_margin), round_step)
    margin_rate = (suggest - cost_price) / suggest

    return PricingResult(
        min_price=min_price,
        suggest_price=suggest,
        max_price=max_price,
        promotion_price=promotion,
        price_band=classify_price_band(suggest, market),
        margin_rate=margin_rate,
    )
