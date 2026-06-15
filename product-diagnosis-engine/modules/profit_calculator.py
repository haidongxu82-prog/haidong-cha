from __future__ import annotations

from config import PROFIT_COST_RATIOS


def validate_price(cost_price: float, selling_price: float) -> None:
    if cost_price <= 0:
        raise ValueError("cost_price must be greater than 0")
    if selling_price <= 0:
        raise ValueError("selling_price must be greater than 0")
    if selling_price <= cost_price:
        raise ValueError("selling_price must be greater than cost_price")


def calculate_profit(input_data: dict) -> dict:
    cost_price = float(input_data["cost_price"])
    selling_price = float(input_data["selling_price"])
    validate_price(cost_price, selling_price)

    return {
        level: round(selling_price * ratio - cost_price, 2)
        for level, ratio in PROFIT_COST_RATIOS.items()
    }


def profit_margin_mid(input_data: dict) -> float:
    profit = calculate_profit(input_data)["mid"]
    return round(profit / float(input_data["selling_price"]), 4)
