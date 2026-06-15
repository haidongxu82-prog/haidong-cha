from __future__ import annotations


def build_prompt(shop_data: list[dict], analysis_data: dict) -> str:
    return f"""
你是电商竞品分析专家，请根据以下数据分析该店铺的起店逻辑：

【店铺结构数据】
{analysis_data}

【SKU明细摘要】
{shop_data[:10]}

请输出：
1. 起店模型判断
2. 选款策略
3. 定价策略
4. 流量策略
5. 可复制方法
""".strip()
