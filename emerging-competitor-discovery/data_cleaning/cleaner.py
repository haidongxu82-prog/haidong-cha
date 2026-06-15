from __future__ import annotations

import re
from datetime import date, datetime


def normalize_brand_name(name: str) -> str:
    value = re.sub(r"\s+", "", str(name or "").strip().lower())
    return re.sub(r"[旗舰店官方专营店铺]", "", value)


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.fromisoformat(str(value)).date()


def clean_records(records: list[dict], today: date | None = None) -> list[dict]:
    today = today or date(2026, 6, 15)
    seen = set()
    cleaned = []
    for item in records:
        store_name = str(item.get("store_name") or "").strip()
        platform = str(item.get("platform") or "").strip().lower()
        key = (normalize_brand_name(store_name), platform)
        if not store_name or not platform or key in seen:
            continue
        seen.add(key)

        first_seen = parse_date(item.get("first_seen_date"))
        days = (today - first_seen).days if first_seen else 999
        cleaned.append({
            "store_id": str(item.get("store_id") or f"{platform}_{len(cleaned) + 1}"),
            "store_name": store_name,
            "store_name_normalized": key[0],
            "platform": platform,
            "category": item.get("category") or "unknown",
            "product_count": int(item.get("product_count") or 0),
            "first_seen_date": first_seen.isoformat() if first_seen else None,
            "first_seen_days": max(days, 0),
            "metrics": {
                "sales_index": float(item.get("sales_index") or 0),
                "ad_index": float(item.get("ad_index") or 0),
                "social_index": float(item.get("social_index") or 0),
                "ad_index_3d_ago": float(item.get("ad_index_3d_ago") or 0),
                "social_index_3d_ago": float(item.get("social_index_3d_ago") or 0),
            }
        })
    return cleaned
