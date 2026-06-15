from __future__ import annotations

from ai.llm_client import rule_based_pricing_insight
from config import settings
from core.market_calc import calc_market_price
from core.pricing_engine import suggest_price
from data.competitor_loader import get_competitors
from data.sales_loader import get_sales
from data.sku_loader import get_sku


def build_pricing_suggestion(sku_id: str) -> dict:
    sku = get_sku(sku_id)
    competitors = get_competitors(sku_id)
    sales = get_sales(sku_id)

    market = calc_market_price(
        competitors,
        low_q=settings.OUTLIER_LOW_QUANTILE,
        high_q=settings.OUTLIER_HIGH_QUANTILE,
    )
    pricing = suggest_price(
        float(sku["cost_price"]),
        market,
        min_margin=settings.MIN_MARGIN,
        promotion_margin=settings.PROMOTION_MARGIN,
        round_step=settings.PRICE_ROUND_STEP,
    )

    payload = {
        "sku_id": sku["sku_id"],
        "product_name": sku["product_name"],
        "category": sku["category"],
        "brand": sku["brand"],
        "cost_price": float(sku["cost_price"]),
        "market_price": market.to_dict(),
        "pricing": pricing.to_dict(),
        "sales": sales,
        "risk_control": {
            "auto_price_change": False,
            "cost_validated": True,
            "outlier_filter": "P5/P95",
            "explainable": True,
        }
    }
    payload["ai_insight"] = rule_based_pricing_insight(payload)
    return payload
