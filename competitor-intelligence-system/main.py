from __future__ import annotations

import json
from pathlib import Path

from ai.prompt_builder import build_prompt
from ai.report_generator import generate_report
from analyzer.competitor_profile import build_competitor_profile
from analyzer.structure_analysis import analyze_shop_structure
from analyzer.trend_detection import detect_trends
from collector.scraper_douyin import fetch_shop_products as fetch_douyin
from collector.scraper_taobao import fetch_shop_products as fetch_taobao
from collector.scraper_xiaohongshu import fetch_shop_products as fetch_xiaohongshu
from processor.normalize import clean_data
from processor.sales_estimator import append_sales_level
from processor.sku_classifier import classify_products


ROOT_DIR = Path(__file__).resolve().parent


def load_settings() -> dict:
    return json.loads((ROOT_DIR / "config" / "settings.yaml").read_text(encoding="utf-8"))


def fetch_by_platform(platform: str, shop_url: str) -> list[dict]:
    if platform == "taobao":
        return fetch_taobao(shop_url)
    if platform == "xiaohongshu":
        return fetch_xiaohongshu(shop_url)
    return fetch_douyin(shop_url)


def run_shop(shop: dict) -> dict:
    raw_data = fetch_by_platform(shop["platform"], shop["shop_url"])
    clean = clean_data(raw_data)
    classified = classify_products(clean)
    enriched = append_sales_level(classified)
    analysis = analyze_shop_structure(enriched)
    trends = detect_trends(enriched)
    profile = build_competitor_profile(shop, enriched, analysis)
    prompt = build_prompt(enriched, analysis)
    report = generate_report(prompt, profile, trends)
    return {
        "shop": shop,
        "products": enriched,
        "analysis": analysis,
        "trends": trends,
        "profile": profile,
        "prompt": prompt,
        "report": report,
    }


def write_outputs(results: list[dict], settings: dict) -> dict[str, str]:
    output_dir = ROOT_DIR / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    daily = "\n\n---\n\n".join(item["report"] for item in results)
    weekly = build_weekly_report(results)
    payload = {"results": results}

    daily_path = ROOT_DIR / settings["report"]["daily_output"]
    weekly_path = ROOT_DIR / settings["report"]["weekly_output"]
    json_path = ROOT_DIR / settings["report"]["json_output"]
    daily_path.write_text(daily, encoding="utf-8")
    weekly_path.write_text(weekly, encoding="utf-8")
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"daily": str(daily_path), "weekly": str(weekly_path), "json": str(json_path)}


def build_weekly_report(results: list[dict]) -> str:
    lines = [
        "# 竞店周报",
        "",
        "## 店铺对比",
    ]
    for item in results:
        analysis = item["analysis"]
        lines.append(f"- {item['shop']['shop_name']}：模型={item['profile']['model_guess']}，爆款占比={analysis['爆款占比']:.2%}，均价={analysis['均价']}")
    lines.extend([
        "",
        "## 本周动作",
        "- 跟踪各店Top SKU是否连续上榜。",
        "- 拆解高销量SKU主图、标题和价格带。",
        "- 记录新增SKU，判断是否进入高频测款状态。",
    ])
    return "\n".join(lines) + "\n"


def run() -> dict[str, str]:
    settings = load_settings()
    results = [run_shop(shop) for shop in settings["shops"]]
    return write_outputs(results, settings)


if __name__ == "__main__":
    print(run())
