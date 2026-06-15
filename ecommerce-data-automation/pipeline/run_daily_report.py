from __future__ import annotations

import argparse
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = CURRENT_DIR.parents[0]
sys.path.insert(0, str(PROJECT_DIR))

from modules.diagnosis import diagnose_products
from modules.io_utils import ensure_output_dir, load_config, read_csv, write_json
from modules.metrics import (
    build_product_fact,
    calculate_health_score,
    category_summary,
    daily_new_products,
    daily_payment_rate,
    filter_period,
    prepare_metrics,
)
from modules.report import build_payload, write_excel, write_markdown


def run(start_date: str, end_date: str) -> dict[str, str]:
    config = load_config()
    launch = read_csv("product_launch.csv", parse_dates=["launch_time"])
    metrics = read_csv("product_metrics_daily.csv", parse_dates=["stat_date"])

    launch = launch[(launch["launch_time"] >= start_date) & (launch["launch_time"] <= f"{end_date} 23:59:59")]
    metrics = prepare_metrics(filter_period(metrics, start_date, end_date))

    fact = build_product_fact(launch, metrics)
    fact = calculate_health_score(fact, config)
    diagnosis = diagnose_products(fact, config)
    daily_launch = daily_new_products(launch)
    daily_payment = daily_payment_rate(metrics)
    category = category_summary(fact)

    output_dir = ensure_output_dir()
    payload = build_payload(start_date, end_date, fact, daily_launch, daily_payment, category, diagnosis)

    json_path = write_json(payload, "diagnosis_report.json")
    excel_path = write_excel(
        fact,
        daily_launch,
        daily_payment,
        category,
        diagnosis,
        output_dir / "ecommerce_automation_report.xlsx",
    )
    markdown_path = write_markdown(payload, output_dir / "daily_report.md")

    return {
        "json": str(json_path),
        "excel": str(excel_path),
        "markdown": str(markdown_path),
    }


def parse_args() -> argparse.Namespace:
    config = load_config()
    parser = argparse.ArgumentParser(description="Run ecommerce data automation report.")
    parser.add_argument("--start-date", default=config["report"]["default_start_date"])
    parser.add_argument("--end-date", default=config["report"]["default_end_date"])
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    print(run(args.start_date, args.end_date))
