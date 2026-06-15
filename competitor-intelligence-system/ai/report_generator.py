from __future__ import annotations

from .insight_extractor import extract_rule_insights


def generate_report(prompt: str, profile: dict, trends: dict) -> str:
    insights = extract_rule_insights(profile)
    analysis = profile["analysis"]
    lines = [
        f"# {profile['shop_name']} 竞品策略分析",
        "",
        "## 起店模型判断",
        f"- {profile['model_guess']}",
        "",
        "## 关键洞察",
    ]
    lines.extend([f"- {item}" for item in insights])
    lines.extend([
        "",
        "## 选款策略",
        f"- 爆款占比：{analysis['爆款占比']:.2%}",
        f"- SKU结构：{analysis['SKU结构']}",
        "",
        "## 定价策略",
        f"- 均价：{analysis['均价']}",
        f"- 价格带分布：{analysis['价格带分布']}",
        "",
        "## 流量策略",
        f"- 热销商品视觉风格：{trends['hot_product_image_styles']}",
        "",
        "## 可复制方法",
        "- 拆解Top SKU主图、价格、标题关键词，优先复制已验证结构。",
        "- 引流款负责拉点击，利润款负责承接转化和毛利。",
        "- 每周跟踪新增SKU和爆款排名变化。",
    ])
    return "\n".join(lines) + "\n"
