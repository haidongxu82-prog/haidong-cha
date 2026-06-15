from __future__ import annotations

from .api_clients import fetch_by_api
from .fallback_data import fallback_products


def fetch_shop_products(shop_url: str) -> list[dict]:
    data = fetch_by_api("xiaohongshu", shop_url)
    return data or fallback_products(shop_url, platform="xiaohongshu")
