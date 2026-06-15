from __future__ import annotations

import pandas as pd


def analyze_ads(ads: pd.DataFrame, config: dict) -> pd.DataFrame:
    df = ads.copy()
    df["gmv"] = df["orders"] * df["avg_order_value"]
    df["roi"] = (df["gmv"] / df["spend"].replace(0, pd.NA)).fillna(0)
    df["ctr"] = (df["clicks"] / df["impressions"].replace(0, pd.NA)).fillna(0)
    thresholds = config["ads"]

    def status(roi: float) -> str:
        if roi < thresholds["low_roi"]:
            return "亏损"
        if roi < thresholds["healthy_roi"]:
            return "低效"
        return "健康"

    df["ads_status"] = df["roi"].apply(status)
    df["pause_suggestion"] = df["ads_status"].apply(lambda x: "建议暂停或重建计划" if x == "亏损" else "继续观察" if x == "低效" else "可保留")
    df["roi"] = df["roi"].round(4)
    df["ctr"] = df["ctr"].round(4)
    return df


def sku_ads_summary(ads_result: pd.DataFrame) -> pd.DataFrame:
    df = ads_result.groupby("sku", as_index=False).agg(
        ad_spend=("spend", "sum"),
        ad_gmv=("gmv", "sum"),
        ad_orders=("orders", "sum"),
        campaigns=("campaign_id", "count"),
    )
    df["ad_roi"] = (df["ad_gmv"] / df["ad_spend"].replace(0, pd.NA)).fillna(0).round(4)

    def status(roi: float) -> str:
        if roi < 1:
            return "亏损"
        if roi < 2:
            return "低效"
        return "健康"

    df["ads_status"] = df["ad_roi"].apply(status)
    return df
