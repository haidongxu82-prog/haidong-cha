from pathlib import Path

from PIL import Image


def validate_image(path):
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"image not found: {path}")

    with Image.open(path) as image:
        width, height = image.size
        if width <= 0 or height <= 0:
            raise ValueError(f"invalid image size: {path}")
        if image.format not in {"JPEG", "PNG", "WEBP"}:
            raise ValueError(f"unsupported image format: {image.format}")

    return True
