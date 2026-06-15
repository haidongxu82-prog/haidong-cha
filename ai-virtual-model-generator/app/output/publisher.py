from __future__ import annotations


def upload_to_oss(image_url: str) -> dict:
    return {
        "source": image_url,
        "oss_url": image_url.replace("https://cdn.example.com", "oss://bucket"),
        "cdn_url": image_url,
    }


def update_sku_image(sku_id: str, image_url: str) -> dict:
    return {
        "sku_id": sku_id,
        "image_url": image_url,
        "status": "not_executed_requires_approval",
    }
