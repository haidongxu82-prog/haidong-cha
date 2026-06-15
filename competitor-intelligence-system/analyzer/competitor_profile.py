from __future__ import annotations


def build_competitor_profile(shop: dict, products: list[dict], analysis: dict) -> dict:
    hot_products = [item for item in products if item.get("is_hot")]
    return {
        "shop_name": shop["shop_name"],
        "platform": shop["platform"],
        "category": shop["category"],
        "model_guess": infer_shop_model(analysis),
        "top_products": hot_products[:5],
        "analysis": analysis,
    }


def infer_shop_model(analysis: dict) -> str:
    structure = analysis.get("SKU结构", {})
    if structure.get("爆款", 0) >= 8 and analysis.get("爆款占比", 0) >= 0.6:
        return "爆款集中型"
    if structure.get("引流款", 0) >= 2 and structure.get("利润款", 0) >= 3:
        return "引流利润组合型"
    if analysis.get("上新频率") == "高频上新":
        return "高频测款型"
    return "稳态运营型"
