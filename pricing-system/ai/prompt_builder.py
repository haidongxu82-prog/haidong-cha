from __future__ import annotations

import json


def build_pricing_prompt(input_payload: dict) -> str:
    return f"""
你是电商定价分析师，请根据以下数据输出定价建议：

要求：
1. 输出建议售价是否合理
2. 是否建议提高/降低价格
3. 给出原因（基于成本+竞品）
4. 输出是否适合促销
5. 只输出 JSON

数据如下：
{json.dumps(input_payload, ensure_ascii=False, indent=2)}

输出字段：
- recommended_price
- price_direction: up | down | hold
- reason
- promotion_suggestion
""".strip()
