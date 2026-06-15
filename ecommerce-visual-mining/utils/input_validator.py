from __future__ import annotations

from config import DEFAULT_TOP_N_PRODUCTS, SUPPORTED_PLATFORMS


def validate_input(input_data: dict) -> dict:
    required = ["platform", "category", "competitor_urls", "analysis_scope", "output_language"]
    missing = [key for key in required if key not in input_data]
    if missing:
        raise ValueError(f"missing required fields: {', '.join(missing)}")
    if input_data["platform"] not in SUPPORTED_PLATFORMS:
        raise ValueError(f"unsupported platform: {input_data['platform']}")
    if not input_data["competitor_urls"]:
        raise ValueError("competitor_urls cannot be empty")

    payload = dict(input_data)
    payload["top_n_products"] = int(payload.get("top_n_products") or DEFAULT_TOP_N_PRODUCTS)
    payload["analysis_scope"] = {
        "include_homepage": bool(payload["analysis_scope"].get("include_homepage", True)),
        "include_product_detail": bool(payload["analysis_scope"].get("include_product_detail", True)),
        "include_main_images": bool(payload["analysis_scope"].get("include_main_images", True)),
    }
    return payload
