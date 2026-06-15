from __future__ import annotations


def generate_visual_patterns(hot_products: list[dict], visual_analysis: dict, category: str) -> list[dict]:
    patterns = []
    main_style = visual_analysis["main_image_style"]

    if "白底" in main_style or "极简" in main_style:
        patterns.append({
            "pattern_name": "高转化主图结构A",
            "description": "白底或低干扰背景，产品居中放大，旁边保留1个核心卖点。",
            "use_case": category,
            "why_it_works": "降低认知成本，让用户先看清商品，再理解卖点。",
        })
    else:
        patterns.append({
            "pattern_name": "场景化主图结构A",
            "description": "真人或场景图展示使用效果，商品主体占画面核心位置。",
            "use_case": category,
            "why_it_works": "提升代入感，适合需要展示穿着/使用效果的商品。",
        })

    if any(item["signals"]["appears_in_multiple_shops"] for item in hot_products):
        patterns.append({
            "pattern_name": "重复爆款识别结构",
            "description": "多店重复出现的款式优先拆解主图、标题和价格带。",
            "use_case": "竞品跟踪",
            "why_it_works": "重复出现说明市场已验证，适合作为选品或素材参考。",
        })

    patterns.append({
        "pattern_name": "详情页高转化结构",
        "description": "痛点引入 → 卖点拆解 → 场景展示 → 对比证明 → 参数 → 评价 → CTA。",
        "use_case": category,
        "why_it_works": "按照用户决策顺序组织信息，减少跳失。",
    })
    return patterns
