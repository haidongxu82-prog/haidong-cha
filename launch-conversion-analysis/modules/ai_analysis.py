def reason_category(row):
    reasons = []
    if row["impressions"] < 15000:
        reasons.append(("流量", "高", "曝光不足，先提升搜索/推荐流量入口。"))
    if row["ctr"] < row.get("avg_ctr", 0) * 0.8:
        reasons.append(("流量", "中", "CTR低于市场，优化主图和标题钩子。"))
    if row["order_cvr"] < row.get("avg_conversion_rate", 0) * 0.8:
        reasons.append(("转化", "高", "点击后转化弱，优化详情页、评价、尺码和利益点。"))
    if row["avg_price"] > 250 and row["conversion_rate"] == 0:
        reasons.append(("价格", "中", "价格带偏高且无成交，建议测试优惠或更强价值证明。"))
    if row["gmv"] < row.get("avg_gmv", 0) * 0.8:
        reasons.append(("竞争", "中", "GMV弱于市场，需对标竞品卖点和视觉表达。"))
    if not reasons:
        reasons.append(("观察", "低", "未发现明显短板，继续观察样本量。"))
    return reasons


def recommendation(row):
    reasons = reason_category(row)
    high_reasons = [item for item in reasons if item[1] == "高"]
    if row["conversion_rate"] == 0 and high_reasons:
        decision = "否"
    elif row["conversion_rate"] < 0.15:
        decision = "观察"
    else:
        decision = "是"
    return {
        "style_tag": row["style_tag"],
        "reason_analysis": [
            {
                "category": category,
                "possibility": level,
                "action": action,
            }
            for category, level, action in reasons
        ],
        "continue_push": decision,
    }


def build_ai_analysis(benchmarked):
    return [recommendation(row) for _, row in benchmarked.iterrows()]
