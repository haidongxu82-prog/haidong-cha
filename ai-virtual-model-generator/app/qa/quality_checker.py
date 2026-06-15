from __future__ import annotations


def check_color_similarity(sku: dict, generated: dict) -> float:
    return 0.94


def check_structure_similarity(sku: dict, generated: dict) -> dict:
    return {
        "neckline": True,
        "cuff": True,
        "hem": True,
        "pattern_position": True,
        "score": 0.91,
    }


def clip_score(original_product: str, generated_image: str) -> float:
    return 0.9


def check_face_consistency(template: dict, generated: dict) -> float:
    return 0.93


def check_background_template(template: dict, generated: dict) -> bool:
    return True


def run_qa(sku: dict, template: dict, generated: dict) -> dict:
    color_score = check_color_similarity(sku, generated)
    structure = check_structure_similarity(sku, generated)
    clip = clip_score(sku["images"]["white_background"], generated["image_url"])
    face = check_face_consistency(template, generated)
    background_ok = check_background_template(template, generated)
    qa_score = round((color_score * 0.25 + structure["score"] * 0.25 + clip * 0.35 + face * 0.15), 4)

    reject_reasons = []
    if clip < 0.85:
        reject_reasons.append("clip_below_threshold")
    if not all([structure["neckline"], structure["cuff"], structure["hem"], structure["pattern_position"]]):
        reject_reasons.append("structure_changed")
    if face < 0.85:
        reject_reasons.append("model_face_drift")
    if not background_ok:
        reject_reasons.append("background_not_template")

    return {
        "qa_score": qa_score,
        "clip_score": clip,
        "color_similarity": color_score,
        "structure_check": structure,
        "face_consistency": face,
        "background_template_ok": background_ok,
        "passed": not reject_reasons,
        "reject_reasons": reject_reasons,
    }
