from __future__ import annotations

from .prompt_builder import build_generation_prompt


def generate_model_image(sku: dict, template: dict) -> dict:
    prompt = build_generation_prompt(sku, template)
    mock_image_url = (
        f"https://cdn.example.com/virtual-model/{sku['sku_id']}/"
        f"{template['template_id']}-001.jpg"
    )
    return {
        "status": "success",
        "sku_id": sku["sku_id"],
        "template_id": template["template_id"],
        "image_url": mock_image_url,
        "prompt": prompt,
        "generation_mode": "mock_image_to_image_adapter",
        "constraints": {
            "fixed_model_identity": template["model_profile"],
            "fixed_scene": template["scene"],
            "fixed_pose": template["pose"],
            "preserve_product_design": True,
        }
    }
