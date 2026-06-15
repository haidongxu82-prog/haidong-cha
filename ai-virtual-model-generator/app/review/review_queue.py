from __future__ import annotations


def create_review_item(sku: dict, generated: dict, qa: dict) -> dict:
    return {
        "sku_id": sku["sku_id"],
        "generated_images": [generated["image_url"]],
        "qa_score": qa["qa_score"],
        "status": "pending_review" if qa["passed"] else "rejected",
        "reject_reasons": qa["reject_reasons"],
        "allowed_transitions": ["approved", "rejected", "regenerated"] if qa["passed"] else ["regenerated"],
    }
