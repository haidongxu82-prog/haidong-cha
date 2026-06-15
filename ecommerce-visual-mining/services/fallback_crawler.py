from __future__ import annotations


def fallback_crawl_shop(shop_url: str, shop_index: int, category: str, platform: str, top_n: int) -> dict:
    products = build_products(category, shop_index, top_n)
    return {
        "shop_id": f"shop_{shop_index}",
        "shop_url": shop_url,
        "platform": platform,
        "homepage_images": [
            f"https://example.com/shop-{shop_index}/banner-1.jpg",
            f"https://example.com/shop-{shop_index}/banner-2.jpg",
        ],
        "visual_profile": build_visual_profile(shop_index),
        "products": products,
    }


def build_products(category: str, shop_index: int, top_n: int) -> list[dict]:
    base_names = [
        "显瘦通勤连衣裙",
        "高腰阔腿休闲裤",
        "轻薄防晒开衫",
        "复古印花短袖",
        "小香风短外套",
        "基础百搭T恤",
    ]
    products = []
    for i in range(min(top_n, len(base_names))):
        sales = 900 - i * 110 - (shop_index - 1) * 45
        likes = 2600 - i * 260 - (shop_index - 1) * 80
        comments = 220 - i * 18
        title = base_names[i]
        if shop_index == 2 and i in (0, 1, 2):
            title = base_names[i]
        products.append({
            "title": f"{category}{title}",
            "price": 79 + i * 20 + shop_index * 5,
            "sales": max(sales, 80),
            "likes": max(likes, 120),
            "comments": max(comments, 20),
            "image_urls": [f"https://example.com/shop-{shop_index}/product-{i+1}-main.jpg"],
            "detail_images": [
                f"https://example.com/shop-{shop_index}/product-{i+1}-detail-1.jpg",
                f"https://example.com/shop-{shop_index}/product-{i+1}-detail-2.jpg",
            ],
            "visual_clarity_score": round(0.88 - i * 0.04, 2),
        })
    return products


def build_visual_profile(shop_index: int) -> dict:
    if shop_index % 2:
        return {
            "main_image_style": "极简白底",
            "homepage_style": "品牌型",
            "detail_page_style": "结构化长图",
            "color_system": ["#F8F5EF", "#222222", "#C9A45C"],
            "information_density": "低",
        }
    return {
        "main_image_style": "生活场景",
        "homepage_style": "混合型",
        "detail_page_style": "信息流型",
        "color_system": ["#FFFFFF", "#D94B3D", "#2B2B2B"],
        "information_density": "中",
    }
