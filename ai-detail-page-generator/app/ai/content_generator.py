from __future__ import annotations

from app.core.validators import detect_blocked_claims, require_human_review


def generate_title_options(product: dict) -> list[str]:
    seed = product["title_seed"]
    category = product["category"].split("/")[-1]
    style = product.get("attributes", {}).get("style", "")
    season = product.get("attributes", {}).get("season", "")
    return [
        f"{season}{style}{seed} {category}通勤日常款",
        f"{seed}女 {style}显气质春夏穿搭",
        f"{category}{seed} {style}约会通勤两穿",
    ]


def generate_selling_points(product: dict) -> list[dict]:
    style = product["attributes"].get("style", "")
    fit = product["attributes"].get("fit", "")
    points = [
        {"type": "显瘦", "text": "收腰线条修饰比例"},
        {"type": "百搭", "text": "通勤日常都能搭"},
        {"type": "高级感", "text": "法式简约更显气质"},
    ]
    if "宽松" in fit:
        points[0] = {"type": "舒适", "text": "宽松版型不紧绷"}
    if "简约" in style:
        points.append({"type": "耐看", "text": "低调设计不易过时"})
    return points[:5]


def generate_fabric_description(product: dict) -> str:
    material = (product.get("material") or "").strip()
    if not material:
        return "面料信息待确认，不可编造。建议补充材质、厚薄、弹力和洗护信息后发布。"
    season = product["attributes"].get("season", "")
    return f"{material}面料，适合{season}穿着。触感、透气性和厚薄以实物检测信息为准。"


def generate_fit_analysis(product: dict) -> dict:
    fit = product["attributes"].get("fit") or ""
    style = product["attributes"].get("style") or ""
    confidence = 0.78 if fit else 0.52
    is_slim = "修身" in fit or "收腰" in product["title_seed"]
    return {
        "is_slimming": bool(is_slim),
        "covers_body": "宽松" in fit,
        "body_shape_effect": "强调腰线，修饰上下身比例" if is_slim else "版型信息不足，需人工确认",
        "recommended_people": infer_people(style, fit),
        "confidence": confidence,
        "require_human_review": require_human_review(confidence),
    }


def infer_people(style: str, fit: str) -> list[str]:
    people = []
    if "通勤" in style:
        people.append("通勤人群")
    if "法式" in style:
        people.append("偏气质穿搭用户")
    if "宽松" in fit:
        people.append("偏好舒适版型用户")
    return people or ["日常穿搭用户"]


def generate_scenes(product: dict) -> list[dict]:
    style = product["attributes"].get("style", "")
    scenes = [
        {"scene": "通勤", "match": 0.9 if "通勤" in style else 0.65, "copy": "上班通勤保持利落气质"},
        {"scene": "约会", "match": 0.82 if "法式" in style else 0.6, "copy": "约会场景更显温柔精致"},
        {"scene": "日常", "match": 0.78, "copy": "日常出门简单搭配即可"},
        {"scene": "度假", "match": 0.55, "copy": "适合轻松拍照场景，需搭配配饰"},
    ]
    return sorted(scenes, key=lambda item: item["match"], reverse=True)


def generate_sections(product: dict, title_options: list[str], risk_flags: list[str]) -> list[dict]:
    selling_points = generate_selling_points(product)
    fabric = generate_fabric_description(product)
    fit = generate_fit_analysis(product)
    scenes = generate_scenes(product)
    detail_images = product["images"].get("detail_images", [])

    sections = [
        {"type": "hero", "content": {"title": title_options[0], "subtitle": "轻松穿出利落与气质"}},
        {"type": "selling_points", "items": selling_points},
        {"type": "fabric", "content": fabric},
        {"type": "fit_analysis", "content": fit},
        {"type": "scene", "items": scenes},
        {
            "type": "detail_showcase",
            "image_mapping": [
                {"image": url, "purpose": f"细节展示 {index + 1}"}
                for index, url in enumerate(detail_images)
            ],
        },
        {"type": "size_guide", "content": "尺码表占位，后续接ERP。当前不可自动生成尺码数据。"},
    ]
    text = str(sections)
    blocked = detect_blocked_claims(text, product.get("material"))
    risk_flags.extend([f"blocked_claim:{claim}" for claim in blocked])
    if fit["require_human_review"]:
        risk_flags.append("fit_confidence_low")
    return sections


def generate_detail_content(product: dict, risk_flags: list[str]) -> dict:
    title_options = generate_title_options(product)
    sections = generate_sections(product, title_options, risk_flags)
    confidence = 0.72 if "missing_material" in risk_flags else 0.86
    return {
        "title_options": title_options,
        "sections": sections,
        "confidence_score": confidence,
    }
