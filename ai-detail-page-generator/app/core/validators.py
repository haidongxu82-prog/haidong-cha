from __future__ import annotations


FUNCTIONAL_CLAIMS = {"抗菌", "防晒", "瘦身", "治疗", "医用", "防螨", "除臭", "永久"}


def validate_input(product: dict) -> list[str]:
    required = ["product_id", "title_seed", "category", "price", "images", "attributes", "brand_tone"]
    missing = [key for key in required if key not in product]
    if missing:
        raise ValueError(f"missing required fields: {', '.join(missing)}")
    if float(product["price"]) <= 0:
        raise ValueError("price must be greater than 0")
    if not product["images"].get("main_white_bg"):
        raise ValueError("images.main_white_bg cannot be empty")

    flags = []
    if not product.get("material"):
        flags.append("missing_material")
    return flags


def detect_blocked_claims(text: str, allowed_material: str | None = None) -> list[str]:
    blocked = [claim for claim in FUNCTIONAL_CLAIMS if claim in text]
    if allowed_material:
        blocked = [claim for claim in blocked if claim not in allowed_material]
    return blocked


def require_human_review(confidence: float) -> bool:
    return confidence < 0.6
