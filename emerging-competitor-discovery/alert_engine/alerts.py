from __future__ import annotations


def percent_increase(current: float, previous: float) -> float:
    if previous <= 0:
        return 1.0 if current > 0 else 0.0
    return (current - previous) / previous


def detect_alerts(record: dict, analysis: dict) -> list[dict]:
    metrics = record["metrics"]
    alerts = []

    if analysis["growth_score"] > 80:
        alerts.append({
            "store_id": record["store_id"],
            "alert_type": "growth_spike",
            "message": f"{record['store_name']} Growth Score {analysis['growth_score']}，需要重点跟踪。"
        })

    if percent_increase(metrics["ad_index"], metrics["ad_index_3d_ago"]) > 0.5:
        alerts.append({
            "store_id": record["store_id"],
            "alert_type": "ad_spike",
            "message": f"{record['store_name']} 3日广告指数增长超过50%。"
        })

    if percent_increase(metrics["social_index"], metrics["social_index_3d_ago"]) > 1.0:
        alerts.append({
            "store_id": record["store_id"],
            "alert_type": "social_spike",
            "message": f"{record['store_name']} 社媒热度出现翻倍增长。"
        })

    if analysis["is_new_brand"]:
        alerts.append({
            "store_id": record["store_id"],
            "alert_type": "new_brand",
            "message": f"{record['store_name']} 是7天内出现的新兴品牌。"
        })

    return alerts
