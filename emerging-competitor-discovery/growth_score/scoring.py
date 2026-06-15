from __future__ import annotations


def calculate_growth_score(sales_index: float, ad_index: float, social_index: float, days_since_first_seen: int) -> float:
    score = (
        sales_index * 0.4
        + ad_index * 0.3
        + social_index * 0.3
    )

    if days_since_first_seen <= 7:
        score += 15
    elif days_since_first_seen <= 30:
        score += 5

    return min(100, round(score, 2))
