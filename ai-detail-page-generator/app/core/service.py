from __future__ import annotations

from app.ai.content_generator import generate_detail_content
from app.core.validators import validate_input
from app.templates.renderer import render_html


def generate_detail_page(product: dict) -> dict:
    risk_flags = validate_input(product)
    content = generate_detail_content(product, risk_flags)
    html = render_html(product, content)
    image_layout = {
        "main_white_bg": [{"source": url, "target_size": "1000x1000", "background": "#FFFFFF"} for url in product["images"].get("main_white_bg", [])],
        "detail_images": [{"source": url, "processing": "sharpen+denoise"} for url in product["images"].get("detail_images", [])],
    }
    return {
        "title_options": content["title_options"],
        "sections": content["sections"],
        "image_layout": image_layout,
        "html": html,
        "risk_flags": sorted(set(risk_flags)),
        "confidence_score": content["confidence_score"],
    }
