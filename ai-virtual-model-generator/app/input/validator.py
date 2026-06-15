from __future__ import annotations


def validate_sku_input(sku: dict) -> None:
    required = ["sku_id", "title", "category", "images", "attributes"]
    missing = [key for key in required if key not in sku]
    if missing:
        raise ValueError(f"missing required fields: {', '.join(missing)}")
    if not sku["images"].get("white_background"):
        raise ValueError("images.white_background is required")
    attrs = sku.get("attributes", {})
    for key in ["color", "fabric", "fit"]:
        if key not in attrs:
            raise ValueError(f"attributes.{key} is required")
