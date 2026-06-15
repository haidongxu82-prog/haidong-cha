from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter


def standardize_main_image(input_path: str | Path, output_dir: str | Path, size: int = 1000) -> dict:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(input_path).convert("RGB")
    source.thumbnail((size, size))
    canvas = Image.new("RGB", (size, size), "#FFFFFF")
    x = (size - source.width) // 2
    y = (size - source.height) // 2
    canvas.paste(source, (x, y))
    return save_dual_format(canvas, output_dir, Path(input_path).stem)


def enhance_detail_image(input_path: str | Path, output_dir: str | Path) -> dict:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(input_path).convert("RGB")
    enhanced = source.filter(ImageFilter.SHARPEN)
    return save_dual_format(enhanced, output_dir, Path(input_path).stem)


def save_dual_format(image: Image.Image, output_dir: Path, name: str) -> dict:
    jpg_path = output_dir / f"{name}.jpg"
    webp_path = output_dir / f"{name}.webp"
    image.save(jpg_path, quality=92)
    image.save(webp_path, quality=88)
    return {"jpg": str(jpg_path), "webp": str(webp_path)}
