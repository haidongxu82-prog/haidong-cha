from __future__ import annotations

import json
from pathlib import Path

from modules.data_crawler import crawl_competitor_shops
from modules.hot_product import identify_hot_products
from modules.optimization import generate_optimization_plan
from modules.pattern_generator import generate_visual_patterns
from modules.report_builder import build_report, write_json_report, write_markdown_report
from modules.visual_analyzer import analyze_visual_style
from utils.input_validator import validate_input


ROOT_DIR = Path(__file__).resolve().parent


def run_visual_mining(input_data: dict) -> dict:
    payload = validate_input(input_data)
    shops = crawl_competitor_shops(payload)
    hot_products = identify_hot_products(shops, payload["top_n_products"])
    visual_analysis = analyze_visual_style(shops)
    patterns = generate_visual_patterns(hot_products, visual_analysis, payload["category"])
    plan = generate_optimization_plan(payload["category"], visual_analysis, hot_products)
    return build_report(payload, shops, hot_products, visual_analysis, patterns, plan)


def run_sample() -> dict:
    sample = json.loads((ROOT_DIR / "data" / "sample_input.json").read_text(encoding="utf-8"))
    report = run_visual_mining(sample)
    write_json_report(report, ROOT_DIR / "output" / "visual_mining_report.json")
    write_markdown_report(report, ROOT_DIR / "output" / "visual_mining_report.md")
    return report


if __name__ == "__main__":
    print(json.dumps(run_sample(), ensure_ascii=False, indent=2))
