from __future__ import annotations

import json
from pathlib import Path

from modules.ai_analyzer import analyze_competitors
from modules.competitor_scraper import get_competitors
from modules.profit_calculator import calculate_profit
from modules.report_builder import build_report, write_report
from modules.scorer import calculate_score
from modules.strategy_generator import generate_strategy
from utils.data_cleaner import clean_input


ROOT_DIR = Path(__file__).resolve().parent


def run_product_diagnosis(input_data: dict) -> dict:
    payload = clean_input(input_data)
    competitors = get_competitors(payload)
    analysis = analyze_competitors(competitors)
    profit = calculate_profit(payload)
    score = calculate_score(payload, analysis, profit)
    strategy = generate_strategy(payload, analysis, profit, score)
    return build_report(payload, competitors, analysis, profit, score, strategy)


def run_sample() -> dict:
    sample = json.loads((ROOT_DIR / "data" / "sample_input.json").read_text(encoding="utf-8"))
    report = run_product_diagnosis(sample)
    write_report(report, ROOT_DIR / "output" / "report.json")
    return report


if __name__ == "__main__":
    print(json.dumps(run_sample(), ensure_ascii=False, indent=2))
