def attach_benchmark(style_summary, benchmark_df):
    result = style_summary.merge(benchmark_df, on=["category", "style_tag"], how="left")
    result["ctr_gap"] = result["ctr"] - result["avg_ctr"].fillna(0)
    result["cvr_gap"] = result["order_cvr"] - result["avg_conversion_rate"].fillna(0)
    result["gmv_gap"] = result["gmv"] - result["avg_gmv"].fillna(0)
    return result


def benchmark_insights(benchmarked):
    insights = []
    for _, row in benchmarked.iterrows():
        style = row["style_tag"]
        if row["avg_ctr"] and row["ctr"] < row["avg_ctr"] * 0.8:
            insights.append(f"{style}款CTR低于市场均值，疑似主图/标题吸引力不足。")
        if row["avg_conversion_rate"] and row["order_cvr"] < row["avg_conversion_rate"] * 0.8:
            insights.append(f"{style}款转化低于市场均值，需排查价格、详情页和卖点表达。")
        if row["avg_gmv"] and row["gmv"] < row["avg_gmv"] * 0.8:
            insights.append(f"{style}款GMV低于市场均值，可能流量承接或供给竞争力不足。")
    return insights
