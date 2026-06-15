from __future__ import annotations

from app.generation.generator import generate_model_image
from app.input.validator import validate_sku_input
from app.output.publisher import upload_to_oss
from app.qa.quality_checker import run_qa
from app.review.review_queue import create_review_item
from app.router.category_router import route_category
from app.templates.template_library import select_template


def run_generation_pipeline(sku: dict, template_id: str | None = None) -> dict:
    validate_sku_input(sku)
    route = route_category(sku["category"])
    template = select_template(route, template_id)
    generated = generate_model_image(sku, template)
    qa = run_qa(sku, template, generated)
    review_item = create_review_item(sku, generated, qa)
    upload = upload_to_oss(generated["image_url"]) if qa["passed"] else None
    return {
        "status": "success" if qa["passed"] else "rejected",
        "sku_id": sku["sku_id"],
        "route": route,
        "template": template,
        "generated": generated,
        "qa": qa,
        "review": review_item,
        "output": upload,
        "publish_policy": "manual_review_required",
    }
