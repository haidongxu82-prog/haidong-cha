from __future__ import annotations

from config import MOCK_COMPETITOR_TOP_N
from services.douyin_api import fetch_douyin_competitors
from services.fallback_scraper import fallback_competitors
from services.pdd_api import fetch_pdd_competitors
from services.taobao_api import fetch_taobao_competitors


def get_competitors(input_data: dict, top_n: int = MOCK_COMPETITOR_TOP_N) -> list[dict]:
    platform = input_data.get("platform", "").lower()

    fetchers = {
        "taobao": fetch_taobao_competitors,
        "douyin": fetch_douyin_competitors,
        "pdd": fetch_pdd_competitors,
    }

    fetcher = fetchers.get(platform)
    if fetcher:
        try:
            data = fetcher(input_data, top_n=top_n)
            if data:
                return data[:top_n]
        except Exception:
            pass

    return fallback_competitors(input_data, top_n=top_n)
