from __future__ import annotations

import pandas as pd


def analyze_pricing(products: pd.DataFrame, competitors: pd.DataFrame, config: dict) -> pd.DataFrame:
    comp = competitors.groupby("sku", as_index=False).agg(
        competitor_avg_price=("price", "mean"),
        competitor_min_price=("price", "min"),
        competitor_max_price=("price", "max"),
        competitor_sales_estimate=("sales_estimate", "mean"),
    )
    df = products.merge(comp, on="sku", how="left")
    pricing_config = config["pricing"]
    df["price_gap"] = df["price"] - df["competitor_avg_price"]
    df["price_gap_rate"] = (df["price_gap"] / df["competitor_avg_price"]).fillna(0)

    def flag(row: pd.Series) -> str:
        if row["price"] < row["cost"] * pricing_config["cost_risk_ratio"]:
            return "亏损风险"
        if row["price"] > row["competitor_avg_price"] * pricing_config["high_price_ratio"]:
            return "高价风险"
        return "正常"

    def position(row: pd.Series) -> str:
        if row["price_gap"] > 0:
            return "高于市场"
        if row["price_gap"] < 0:
            return "低于市场"
        return "贴近市场"

    df["pricing_flag"] = df.apply(flag, axis=1)
    df["market_position"] = df.apply(position, axis=1)
    df["suggest_price_low"] = (df["competitor_avg_price"] * pricing_config["suggest_low_ratio"]).round(2)
    df["suggest_price_high"] = (df["competitor_avg_price"] * pricing_config["suggest_high_ratio"]).round(2)
    return df
