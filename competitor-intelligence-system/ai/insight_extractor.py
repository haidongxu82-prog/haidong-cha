from __future__ import annotations


def extract_rule_insights(profile: dict) -> list[str]:
    analysis = profile["analysis"]
    insights = []
    if analysis["爆款占比"] >= 0.5:
        insights.append("爆款占比较高，店铺依赖少数高销量SKU拉动。")
    if analysis["价格带分布"].get("100+", 0) >= analysis["价格带分布"].get("0-30", 0):
        insights.append("价格带偏中高，具备利润款运营特征。")
    if analysis["上新频率"] == "高频上新":
        insights.append("上新节奏快，可能采用高频测款模型。")
    return insights or ["店铺结构较均衡，暂未发现单一强策略。"]
