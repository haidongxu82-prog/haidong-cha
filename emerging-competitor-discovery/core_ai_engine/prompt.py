from __future__ import annotations

import json


PROMPT_TEMPLATE = """
你是电商竞品分析AI。

请根据以下数据判断该店铺/品牌：

1. 是否为新兴品牌
2. 是否为竞品
3. 竞品等级（S/A/B/C）
4. 增长评分（0-100）
5. 是否需要预警
6. 简短原因

判断规则：
- 广告指数 + 社媒指数 + 销量指数综合判断增长
- 7天内出现且指数上升 → 新兴品牌
- 高增长 + 同类目 → S级竞品
- 中等增长 → A/B级
- 无增长 → C级

输出必须是JSON：

{
  "is_new_brand": true/false,
  "is_competitor": true/false,
  "competitor_level": "S|A|B|C",
  "growth_score": 0-100,
  "alert": true/false,
  "reason": ""
}
""".strip()


def build_prompt(record: dict) -> str:
    return PROMPT_TEMPLATE + "\n\n输入数据：\n" + json.dumps(record, ensure_ascii=False, indent=2)
