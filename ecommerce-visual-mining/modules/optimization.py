from __future__ import annotations


def generate_optimization_plan(category: str, visual_analysis: dict, hot_products: list[dict]) -> dict:
    top_products = hot_products[:3]
    return {
        "main_image": [
            "统一使用白底或低干扰背景，避免复杂装饰抢占注意力。",
            "每张主图只表达1个核心卖点，文字元素不超过3个。",
            "产品主体占画面60%-75%，优先保证轮廓清晰。",
            "对爆款商品增加对比结构，例如升级前 vs 升级后、普通款 vs 本款。",
            "保留价格/利益点锚点，但不要遮挡产品主体。"
        ],
        "homepage": [
            "Banner保留品牌主视觉，不堆叠过多促销文字。",
            f"爆款区优先展示：{', '.join(item['product_name'] for item in top_products)}。",
            "分类入口按人群/场景/功能拆分，减少用户选择成本。",
            "增加推荐专区，把同风格或同场景商品做组合陈列。",
            "加入销量、评价、售后保障等信任模块。"
        ],
        "detail_page": [
            "痛点引入：先说明用户为什么需要这个商品。",
            "核心卖点：保留3-5条，配合图标或局部特写。",
            "场景展示：展示真实使用或穿搭场景。",
            "对比图：普通款 vs 本款，突出差异。",
            "参数说明：尺码、材质、工艺、适用人群。",
            "用户评价：优先展示与痛点相关的评价。",
            "CTA收口：强调适用场景和购买理由。"
        ],
        "design_guidelines": [
            f"{category}类目视觉要先清晰，再高级。",
            "不要让促销信息压过商品本身。",
            "主图、首页、详情页的色彩和字体要统一。",
            "所有设计建议必须能落到具体页面模块。"
        ]
    }
