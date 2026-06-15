from __future__ import annotations

import pandas as pd


ISSUE_MAP = {
    "HIGH_RISK_NO_CONVERSION": {
        "issue": "点击较多但无下单",
        "cause": "详情页承接弱、价格或信任不足",
        "recommendation": "检查详情页卖点、评价、尺码和促销利益点"
    },
    "LOW_CTR": {
        "issue": "CTR过低",
        "cause": "主图、标题或搜索关键词吸引力不足",
        "recommendation": "优化主图第一视觉和标题关键词"
    },
    "BAD_COVER_IMAGE_OR_TITLE": {
        "issue": "高曝光低点击",
        "cause": "封面图或标题未匹配推荐人群",
        "recommendation": "测试新封面、利益点前置和人群关键词"
    },
    "PRICE_OR_PRODUCT_ISSUE": {
        "issue": "高点击但无支付",
        "cause": "价格偏高、款式竞争力不足或下单链路阻塞",
        "recommendation": "测试价格带、优惠券、详情页信任元素"
    }
}


def detect_flags(row: pd.Series, config: dict) -> list[str]:
    rules = config["diagnosis_rules"]
    flags: list[str] = []

    if row["clicks"] > rules["zero_conversion_clicks_threshold"] and row["orders"] == 0:
        flags.append("HIGH_RISK_NO_CONVERSION")
    if row["impressions"] > rules["low_ctr_impressions_threshold"] and row["ctr"] < rules["low_ctr_threshold"]:
        flags.append("LOW_CTR")
    if row["impressions"] > rules["bad_cover_impressions_threshold"] and row["ctr"] < rules["bad_cover_ctr_threshold"]:
        flags.append("BAD_COVER_IMAGE_OR_TITLE")
    if row["clicks"] > rules["high_click_no_payment_threshold"] and row["paid_orders"] == 0:
        flags.append("PRICE_OR_PRODUCT_ISSUE")

    return flags


def status_from_score(score: float, config: dict, flags: list[str]) -> str:
    if "HIGH_RISK_NO_CONVERSION" in flags or "PRICE_OR_PRODUCT_ISSUE" in flags:
        return "high_risk"
    status_config = config["health_status"]
    if score >= status_config["healthy_min_score"]:
        return "healthy"
    if score >= status_config["warning_min_score"]:
        return "warning"
    return "high_risk"


def diagnose_products(fact: pd.DataFrame, config: dict) -> pd.DataFrame:
    rows = []
    for _, row in fact.iterrows():
        flags = detect_flags(row, config)
        mapped = [ISSUE_MAP[flag] for flag in flags]
        rows.append({
            "sku": row["sku"],
            "product_id": row["product_id"],
            "title": row["title"],
            "category": row["category"],
            "platform": row["platform"],
            "health_score": row["health_score"],
            "status": status_from_score(row["health_score"], config, flags),
            "flags": flags,
            "issues": [item["issue"] for item in mapped],
            "possible_causes": [item["cause"] for item in mapped],
            "recommendations": [item["recommendation"] for item in mapped],
            "impressions": row["impressions"],
            "clicks": row["clicks"],
            "ctr": round(row["ctr"], 4),
            "orders": row["orders"],
            "paid_orders": row["paid_orders"],
            "paid_amount": row["paid_amount"],
            "conversion_rate": round(row["conversion_rate"], 4),
            "payment_rate": round(row["payment_rate"], 4),
        })
    return pd.DataFrame(rows)
