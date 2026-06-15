from __future__ import annotations

import json
from pathlib import Path


def build_report(input_data: dict, competitors: list[dict], analysis: dict, profit: dict, score: int, strategy: dict) -> dict:
    return {
        "product_score": score,
        "profit_estimation": profit,
        "competitor_summary": [
            {
                "name": item["title"],
                "price": item["price"],
                "sales_level": item["sales_level"],
                "rating": item["rating"],
                "url": item["url"],
            }
            for item in competitors
        ],
        "market_analysis": {
            "competition_level": analysis["market_analysis"]["competition_level"],
            "price_band": analysis["market_analysis"]["price_band"],
            "demand_signal": analysis["market_analysis"]["demand_signal"],
            "market_price": analysis["market_price"],
            "review_pain_points": analysis["market_analysis"]["review_pain_points"],
            "main_selling_points": analysis["market_analysis"]["main_selling_points"],
        },
        "recommendation": {
            "decision": strategy["decision"],
            "reason": strategy["reason"],
            "risk_factors": strategy["risk_factors"],
        },
        "optimization_suggestions": strategy["optimization_suggestions"],
        "input": input_data,
    }


def write_report(report: dict, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return output_path
