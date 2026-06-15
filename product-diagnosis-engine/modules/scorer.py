from __future__ import annotations

from config import SCORING_WEIGHTS


def calculate_score(input_data: dict, analysis: dict, profit: dict) -> int:
    market = analysis["market_analysis"]
    market_price = analysis["market_price"]

    profit_score = score_profit(profit)
    competition_score = score_competition(market["competition_level"])
    demand_score = score_demand(market["demand_signal"])
    price_score = score_price(float(input_data["selling_price"]), market_price["avg"])

    score = (
        profit_score * SCORING_WEIGHTS["profit"]
        + competition_score * SCORING_WEIGHTS["competition"]
        + demand_score * SCORING_WEIGHTS["demand"]
        + price_score * SCORING_WEIGHTS["price"]
    )
    return int(round(score))


def score_profit(profit: dict) -> int:
    mid = float(profit["mid"])
    if mid >= 30:
        return 90
    if mid >= 15:
        return 70
    if mid > 0:
        return 45
    return 10


def score_competition(level: str) -> int:
    return {
        "low": 90,
        "medium": 65,
        "high": 40,
    }.get(level, 50)


def score_demand(signal: str) -> int:
    return {
        "strong": 90,
        "medium": 65,
        "weak": 35,
    }.get(signal, 50)


def score_price(selling_price: float, market_avg: float) -> int:
    if market_avg <= 0:
        return 50
    gap = abs(selling_price - market_avg) / market_avg
    if gap <= 0.08:
        return 90
    if gap <= 0.18:
        return 70
    if selling_price < market_avg:
        return 60
    return 40
