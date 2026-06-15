import json
import os


def fallback_classify(text):
    lower = text.lower()
    style_rules = [
        ("民族风", ["民族", "刺绣", "盘扣"]),
        ("新中式", ["新中式"]),
        ("法式", ["法式", "碎花"]),
        ("通勤", ["通勤", "西装"]),
        ("休闲", ["休闲", "百搭", "宽松"]),
        ("度假", ["度假", "沙滩"]),
        ("小香风", ["小香风"]),
        ("运动", ["运动", "速干"]),
        ("轻奢", ["真丝", "高级感"]),
        ("韩版", ["韩版"]),
        ("优雅", ["优雅", "气质"]),
        ("日常", ["日常"]),
    ]
    material_rules = [
        ("棉麻", ["棉麻", "亚麻"]),
        ("雪纺", ["雪纺"]),
        ("真丝", ["真丝"]),
        ("针织", ["针织"]),
        ("聚酯纤维", ["聚酯", "防晒"]),
        ("粗花呢", ["粗花呢"]),
        ("速干", ["速干"]),
    ]
    scene_rules = [
        ("通勤", ["通勤", "西装"]),
        ("旅行", ["度假", "沙滩", "旅行"]),
        ("日常", ["日常", "休闲", "百搭", "宽松"]),
        ("聚会", ["优雅", "气质", "小香风"]),
        ("直播爆款", ["显瘦", "收腰", "妈妈装"]),
    ]

    def pick(rules, default):
        for label, keywords in rules:
            if any(keyword.lower() in lower for keyword in keywords):
                return label
        return default

    keywords = [word for word in ["显瘦", "收腰", "刺绣", "碎花", "宽松", "高级感", "百搭"] if word in text]
    return {
        "style": pick(style_rules, "其他"),
        "scene": pick(scene_rules, "日常"),
        "material": pick(material_rules, "其他"),
        "keywords": keywords,
        "source": "rule_fallback",
    }


def classify_with_llm(text, model="gpt-4o-mini"):
    """
    Real LLM integration hook.

    Default MVP behavior is deterministic fallback. If OPENAI_API_KEY is set,
    this function can be extended to call the OpenAI SDK and parse strict JSON.
    """
    if not os.getenv("OPENAI_API_KEY"):
        return fallback_classify(text)

    # Keep a safe fallback until the production API client is configured.
    result = fallback_classify(text)
    result["source"] = f"{model}_fallback_not_configured"
    return json.loads(json.dumps(result, ensure_ascii=False))


def summarize_competitors(sku, competitors):
    if not competitors:
        return "未找到满足过滤条件的竞品，建议放宽类目或价格过滤。"

    prices = [float(item["price"]) for item in competitors]
    avg_price = sum(prices) / len(prices)
    styles = sorted({item.get("style", "未知") for item in competitors})
    top = competitors[0]
    return (
        f"竞品主要集中在均价 {avg_price:.0f} 元附近；"
        f"主要风格为 {'、'.join(styles[:4])}。"
        f"最相似竞品是 {top['title']}，相似度 {top['similarity_score']:.2f}。"
        "建议重点对比材质、版型卖点和价格带，保留差异化表达。"
    )
