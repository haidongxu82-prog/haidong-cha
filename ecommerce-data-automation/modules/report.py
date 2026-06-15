from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from .ai_explain import rule_based_explanation


def dataframe_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return df.where(pd.notnull(df), None).to_dict(orient="records")


def build_payload(
    start_date: str,
    end_date: str,
    fact: pd.DataFrame,
    daily_launch: pd.DataFrame,
    daily_payment: pd.DataFrame,
    category: pd.DataFrame,
    diagnosis: pd.DataFrame,
) -> dict[str, Any]:
    total_products = int(fact["sku"].nunique())
    paid_products = int((fact["paid_orders"] > 0).sum())
    total_orders = int(fact["orders"].sum())
    total_paid_orders = int(fact["paid_orders"].sum())
    payment_rate = round(total_paid_orders / total_orders, 4) if total_orders else 0

    diagnosis_records = dataframe_records(diagnosis)
    for item in diagnosis_records:
        item["ai_explanation"] = rule_based_explanation(item)

    high_risk = [item for item in diagnosis_records if item["status"] == "high_risk"]
    warning = [item for item in diagnosis_records if item["status"] == "warning"]

    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "summary": {
            "total_launch_products": total_products,
            "paid_products": paid_products,
            "product_success_rate": round(paid_products / total_products, 4) if total_products else 0,
            "orders": total_orders,
            "paid_orders": total_paid_orders,
            "payment_rate": payment_rate,
            "paid_amount": round(float(fact["paid_amount"].sum()), 2),
            "high_risk_count": len(high_risk),
            "warning_count": len(warning),
        },
        "daily_new_products": dataframe_records(daily_launch),
        "daily_payment_rate": dataframe_records(daily_payment),
        "category_summary": dataframe_records(category),
        "diagnosis": diagnosis_records,
        "priority_actions": build_priority_actions(high_risk, warning),
    }


def build_priority_actions(high_risk: list[dict], warning: list[dict]) -> list[str]:
    actions = []
    if high_risk:
        actions.append("优先处理 high_risk 商品：检查主图、价格、详情页承接和支付链路。")
    if any("LOW_CTR" in item.get("flags", []) for item in high_risk + warning):
        actions.append("对低CTR商品做主图A/B测试，并重写标题关键词。")
    if any("PRICE_OR_PRODUCT_ISSUE" in item.get("flags", []) for item in high_risk + warning):
        actions.append("对高点击低支付商品测试价格、优惠券和信任证明。")
    if not actions:
        actions.append("当前无严重异常，保持每日监控。")
    return actions


def write_excel(
    fact: pd.DataFrame,
    daily_launch: pd.DataFrame,
    daily_payment: pd.DataFrame,
    category: pd.DataFrame,
    diagnosis: pd.DataFrame,
    path: Path,
) -> Path:
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        fact.to_excel(writer, sheet_name="product_fact", index=False)
        daily_launch.to_excel(writer, sheet_name="daily_launch", index=False)
        daily_payment.to_excel(writer, sheet_name="daily_payment", index=False)
        category.to_excel(writer, sheet_name="category_summary", index=False)
        diagnosis.to_excel(writer, sheet_name="diagnosis", index=False)
    return path


def write_markdown(payload: dict[str, Any], path: Path) -> Path:
    summary = payload["summary"]
    lines = [
        f"# 电商数据自动化日报 {payload['period']['start_date']} 至 {payload['period']['end_date']}",
        "",
        "## Summary",
        f"- 上新商品数：{summary['total_launch_products']}",
        f"- 有支付商品数：{summary['paid_products']}",
        f"- 商品成款率：{summary['product_success_rate']:.2%}",
        f"- 支付成款率：{summary['payment_rate']:.2%}",
        f"- 支付金额：{summary['paid_amount']:.2f}",
        f"- 高风险商品：{summary['high_risk_count']}",
        f"- 预警商品：{summary['warning_count']}",
        "",
        "## Priority Actions",
    ]
    lines.extend([f"- {item}" for item in payload["priority_actions"]])
    lines.extend(["", "## High Risk Items"])
    high_risk = [item for item in payload["diagnosis"] if item["status"] == "high_risk"]
    if not high_risk:
        lines.append("- 暂无")
    for item in high_risk:
        lines.append(f"- {item['sku']} / {item['title']} / score={item['health_score']}")
        for issue in item["issues"]:
            lines.append(f"  - {issue}")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path
