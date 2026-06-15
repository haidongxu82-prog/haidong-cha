from __future__ import annotations


def build_ai_prompt(diagnosis_item: dict) -> str:
    return f"""
你是电商运营诊断助手。请基于以下商品数据输出异常原因解释、运营建议和优先级。

要求：
1. 不虚构数据
2. 只解释已有指标和规则命中
3. 输出 JSON

输入：
{diagnosis_item}

输出字段：
- reason
- priority: high | medium | low
- actions: []
""".strip()


def rule_based_explanation(diagnosis_item: dict) -> dict:
    flags = diagnosis_item.get("flags", [])
    if not flags:
        return {
            "reason": "当前未命中主要异常规则，保持观察。",
            "priority": "low",
            "actions": ["继续跟踪曝光、点击和支付变化"]
        }

    priority = "high" if any(flag in flags for flag in ["HIGH_RISK_NO_CONVERSION", "PRICE_OR_PRODUCT_ISSUE"]) else "medium"
    return {
        "reason": "；".join(diagnosis_item.get("possible_causes", [])),
        "priority": priority,
        "actions": diagnosis_item.get("recommendations", [])
    }
