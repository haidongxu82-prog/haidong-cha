from __future__ import annotations

import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from modules.ads_analysis import analyze_ads, sku_ads_summary
from modules.io_utils import ensure_output_dir, load_config, load_input_data, write_json
from modules.llm_summary import rule_based_summary
from modules.pricing_analysis import analyze_pricing
from modules.product_analysis import product_layer_summary, segment_products
from modules.report_generator import build_payload, write_excel, write_markdown
from modules.visual_conversion import detect_visual_conversion_issues


def run() -> dict[str, str]:
    config = load_config()
    products, ads, competitors = load_input_data()

    segmented = segment_products(products, config["product"]["top_percentile"])
    pricing = analyze_pricing(segmented, competitors, config)
    visual = detect_visual_conversion_issues(segmented, config)
    ads_result = analyze_ads(ads, config)
    ads_sku = sku_ads_summary(ads_result)
    layer_summary = product_layer_summary(segmented)

    merged = pricing.merge(visual[["sku", "visual_conversion_issues"]], on="sku", how="left")
    merged = merged.merge(ads_sku[["sku", "ad_spend", "ad_gmv", "ad_roi", "ads_status"]], on="sku", how="left")
    merged["ads_status"] = merged["ads_status"].fillna("无投放")
    merged["ad_spend"] = merged["ad_spend"].fillna(0)
    merged["ad_gmv"] = merged["ad_gmv"].fillna(0)
    merged["ad_roi"] = merged["ad_roi"].fillna(0)

    summary_input = {
        "product_layers": merged["product_layer"].value_counts().to_dict(),
        "pricing_flags": merged["pricing_flag"].value_counts().to_dict(),
        "ads_status": ads_result["ads_status"].value_counts().to_dict(),
    }
    ai_summary = rule_based_summary(summary_input)

    output_dir = ensure_output_dir()
    payload = build_payload(merged, layer_summary, ads_result, ai_summary)
    json_path = write_json(payload, "store_diagnosis.json")
    markdown_path = write_markdown(payload, output_dir / "store_diagnosis.md")
    excel_path = write_excel(
        output_dir / "store_diagnosis.xlsx",
        sku_diagnosis=merged,
        product_layer_summary=layer_summary,
        ads_analysis=ads_result,
    )

    return {
        "json": str(json_path),
        "markdown": str(markdown_path),
        "excel": str(excel_path),
    }


if __name__ == "__main__":
    print(run())
