from __future__ import annotations

from services.fallback_crawler import fallback_crawl_shop


def crawl_competitor_shops(input_data: dict) -> list[dict]:
    shops = []
    for index, url in enumerate(input_data["competitor_urls"], start=1):
        shops.append(fallback_crawl_shop(
            shop_url=url,
            shop_index=index,
            category=input_data["category"],
            platform=input_data["platform"],
            top_n=input_data["top_n_products"],
        ))
    return shops
