from __future__ import annotations

from config import PLATFORM_SUPPORT


def clean_input(input_data: dict) -> dict:
    required = ["product_name", "category", "cost_price", "selling_price", "platform", "target_market"]
    missing = [field for field in required if field not in input_data]
    if missing:
        raise ValueError(f"missing required fields: {', '.join(missing)}")

    payload = dict(input_data)
    payload["platform"] = payload["platform"].lower()
    if payload["platform"] not in PLATFORM_SUPPORT:
        raise ValueError(f"unsupported platform: {payload['platform']}")

    payload["cost_price"] = float(payload["cost_price"])
    payload["selling_price"] = float(payload["selling_price"])
    payload["optional_keywords"] = payload.get("optional_keywords") or []
    return payload
