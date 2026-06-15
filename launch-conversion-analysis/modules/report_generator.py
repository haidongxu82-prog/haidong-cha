import pandas as pd

from modules.io_utils import OUTPUT_DIR, write_json


def build_report_payload(month, fact, overall, style_summary, member_summary, benchmarked, insights, ai_analysis):
    best_style = style_summary.sort_values(["conversion_rate", "gmv"], ascending=False).head(3)["style_tag"].tolist()
    worst_style = style_summary.sort_values(["conversion_rate", "gmv"], ascending=True).head(3)["style_tag"].tolist()
    actions = []
    if insights:
        actions.extend(["优化低CTR款主图和标题", "对低转化款做价格/详情页复盘"])
    actions.append("减少连续低成款款式的上新占比")
    return {
        "month": month,
        "total_launch": overall["total_launch"],
        "success_launch": overall["success_launch"],
        "conversion_rate": overall["conversion_rate"],
        "best_style": best_style,
        "worst_style": worst_style,
        "insights": insights,
        "actions": actions,
        "ai_analysis": ai_analysis,
        "style_analysis": style_summary.to_dict("records"),
        "team_member_analysis": member_summary.to_dict("records"),
        "benchmark_analysis": benchmarked.to_dict("records"),
    }


def write_excel(fact, style_summary, member_summary, benchmarked):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / "launch_conversion_report.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        fact.to_excel(writer, sheet_name="product_fact", index=False)
        style_summary.to_excel(writer, sheet_name="style_summary", index=False)
        member_summary.to_excel(writer, sheet_name="member_summary", index=False)
        benchmarked.to_excel(writer, sheet_name="market_benchmark", index=False)
    return path


def write_markdown(payload):
    path = OUTPUT_DIR / "monthly_report.md"
    lines = [
        f"# 电商上新成款率月报 {payload['month']}",
        "",
        "## Summary",
        f"- 上新数：{payload['total_launch']}",
        f"- 成款数：{payload['success_launch']}",
        f"- 成款率：{payload['conversion_rate']:.2%}",
        f"- 最优款式：{', '.join(payload['best_style'])}",
        f"- 低表现款式：{', '.join(payload['worst_style'])}",
        "",
        "## Insights",
    ]
    lines.extend([f"- {item}" for item in payload["insights"]] or ["- 暂无明显异常。"])
    lines.extend(["", "## Actions"])
    lines.extend([f"- {item}" for item in payload["actions"]])
    lines.extend(["", "## AI Reason Analysis"])
    for item in payload["ai_analysis"]:
        lines.append(f"- {item['style_tag']}：建议继续推款={item['continue_push']}")
        for reason in item["reason_analysis"]:
            lines.append(f"  - {reason['category']} / {reason['possibility']}：{reason['action']}")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_outputs(payload, fact, style_summary, member_summary, benchmarked):
    excel_path = write_excel(fact, style_summary, member_summary, benchmarked)
    json_path = OUTPUT_DIR / "monthly_analysis.json"
    write_json(json_path, payload)
    md_path = write_markdown(payload)
    return {
        "excel": str(excel_path),
        "json": str(json_path),
        "report": str(md_path),
    }
