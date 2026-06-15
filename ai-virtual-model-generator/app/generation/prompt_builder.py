from __future__ import annotations


def build_generation_prompt(sku: dict, template: dict) -> str:
    attrs = sku["attributes"]
    return f"""
Generate a professional e-commerce model image.

Constraints:
- Keep clothing exactly same as reference image
- Do not change design, pattern, color, texture
- Product category: {sku['category']}
- Product title: {sku['title']}
- Product color: {attrs['color']}
- Product fabric: {attrs['fabric']}
- Product fit: {attrs['fit']}
- Use fixed model identity: {template['model_profile']}
- Scene: {template['scene']}
- Lighting: {template['lighting']} professional photography
- Pose: {template['pose_detail']}
- Camera: {template['camera']}
- Style: clean commercial photography

Input:
- product image white background: {sku['images']['white_background']}
""".strip()
