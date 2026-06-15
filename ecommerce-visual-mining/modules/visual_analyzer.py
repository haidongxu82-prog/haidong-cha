from __future__ import annotations

from collections import Counter


def analyze_visual_style(shops: list[dict]) -> dict:
    main_styles = []
    homepage_styles = []
    detail_styles = []
    colors = []
    density = []

    for shop in shops:
        visual = shop["visual_profile"]
        main_styles.append(visual["main_image_style"])
        homepage_styles.append(visual["homepage_style"])
        detail_styles.append(visual["detail_page_style"])
        colors.extend(visual["color_system"])
        density.append(visual["information_density"])

    return {
        "main_image_style": most_common(main_styles),
        "homepage_style": most_common(homepage_styles),
        "detail_page_style": most_common(detail_styles),
        "color_system": list(dict.fromkeys(colors))[:5],
        "design_keywords": build_design_keywords(main_styles, homepage_styles, detail_styles, density),
        "shop_breakdown": [
            {
                "shop_id": shop["shop_id"],
                "shop_url": shop["shop_url"],
                "visual_profile": shop["visual_profile"],
            }
            for shop in shops
        ],
    }


def most_common(values: list[str]) -> str:
    return Counter(values).most_common(1)[0][0] if values else "unknown"


def build_design_keywords(main_styles: list[str], homepage_styles: list[str], detail_styles: list[str], density: list[str]) -> list[str]:
    keywords = []
    if any("极简" in item for item in main_styles):
        keywords.append("低信息密度")
    if any("生活场景" in item for item in main_styles):
        keywords.append("场景化")
    if any("品牌型" in item for item in homepage_styles):
        keywords.append("品牌化")
    if any("结构化" in item for item in detail_styles):
        keywords.append("结构清晰")
    if density.count("高") > density.count("低"):
        keywords.append("促销信息强")
    return keywords or ["清晰", "商业化", "可复制"]
