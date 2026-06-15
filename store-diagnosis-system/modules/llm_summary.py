from __future__ import annotations


def build_llm_prompt(summary: dict) -> str:
    return f"""
你是电商运营诊断专家。请基于以下结构化数据输出店铺诊断。

要求：
1. 不虚构数据
2. 输出 diagnosis、actions、risk_alerts
3. actions 必须包含 priority、action、expected_impact
4. JSON only

输入：
{summary}
""".strip()


def rule_based_summary(summary: dict) -> dict:
    diagnosis = []
    actions = []
    risk_alerts = []

    if summary["product_layers"].get("C", 0) > summary["product_layers"].get("A", 0):
        diagnosis.append("问题款数量偏多，商品结构需要收缩低效SKU。")
        actions.append({
            "priority": "P0",
            "action": "暂停新增同类低转化SKU，优先复盘C类商品主图、详情页和价格。",
            "expected_impact": "减少低效库存和无效投放。"
        })

    if summary["ads_status"].get("亏损", 0) > 0:
        diagnosis.append("存在亏损广告计划，需要控制投放浪费。")
        actions.append({
            "priority": "P0",
            "action": "暂停ROI低于1的广告计划，重建人群和素材测试。",
            "expected_impact": "降低广告亏损。"
        })
        risk_alerts.append("部分广告ROI低于1。")

    if summary["pricing_flags"].get("高价风险", 0) > 0:
        diagnosis.append("部分SKU价格明显高于竞品均值，可能影响转化。")
        actions.append({
            "priority": "P1",
            "action": "对高价风险SKU测试价格区间或强化材质/品牌价值证明。",
            "expected_impact": "提升点击后的购买转化。"
        })

    if not diagnosis:
        diagnosis.append("店铺核心指标未发现明显结构性风险。")
        actions.append({
            "priority": "P2",
            "action": "保持日常监控，继续观察商品层级和广告ROI变化。",
            "expected_impact": "维持健康经营状态。"
        })

    return {
        "diagnosis": diagnosis,
        "actions": actions,
        "risk_alerts": risk_alerts
    }
