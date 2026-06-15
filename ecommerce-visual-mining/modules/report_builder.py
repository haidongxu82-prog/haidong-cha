from __future__ import annotations

import json
from pathlib import Path


def build_report(input_data: dict, shops: list[dict], hot_products: list[dict], visual_analysis: dict, patterns: list[dict], plan: dict) -> dict:
    return {
        "input": input_data,
        "hot_products": hot_products,
        "visual_analysis": visual_analysis,
        "visual_patterns": patterns,
        "optimization_plan": {
            "main_image": plan["main_image"],
            "homepage": plan["homepage"],
            "detail_page": plan["detail_page"],
        },
        "design_guidelines": plan["design_guidelines"],
        "source_summary": {
            "shop_count": len(shops),
            "product_count": sum(len(shop["products"]) for shop in shops),
        }
    }


def write_json_report(report: dict, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def write_markdown_report(report: dict, path: Path) -> Path:
    lines = [
        "# 电商视觉分析 & 爆款挖掘报告",
        "",
        "## 爆款商品",
    ]
    for item in report["hot_products"][:10]:
        lines.append(f"- {item['product_name']} / score={item['hot_score']} / {item['reason']}")

    lines.extend([
        "",
        "## 视觉风格",
        f"- 主图风格：{report['visual_analysis']['main_image_style']}",
        f"- 首页风格：{report['visual_analysis']['homepage_style']}",
        f"- 详情页风格：{report['visual_analysis']['detail_page_style']}",
        f"- 色彩系统：{', '.join(report['visual_analysis']['color_system'])}",
        f"- 设计关键词：{', '.join(report['visual_analysis']['design_keywords'])}",
        "",
        "## 视觉模式",
    ])
    for pattern in report["visual_patterns"]:
        lines.append(f"- {pattern['pattern_name']}：{pattern['description']} 原因：{pattern['why_it_works']}")

    lines.extend(["", "## 主图优化方案"])
    lines.extend([f"- {item}" for item in report["optimization_plan"]["main_image"]])
    lines.extend(["", "## 店铺首页结构"])
    lines.extend([f"- {item}" for item in report["optimization_plan"]["homepage"]])
    lines.extend(["", "## 详情页结构模板"])
    lines.extend([f"- {item}" for item in report["optimization_plan"]["detail_page"]])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path
