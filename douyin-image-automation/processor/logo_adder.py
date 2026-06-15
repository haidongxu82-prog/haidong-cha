from pathlib import Path

from PIL import Image


def add_logo(input_path, logo_path, output_path):
    input_path = Path(input_path)
    logo_path = Path(logo_path)
    output_path = Path(output_path)

    if not input_path.exists():
        raise FileNotFoundError(f"input image not found: {input_path}")
    if not logo_path.exists():
        raise FileNotFoundError(f"logo image not found: {logo_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    base = Image.open(input_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")

    w, h = base.size

    logo_w = int(w * 0.2)
    logo_h = int(logo_w * logo.height / logo.width)
    logo = logo.resize((logo_w, logo_h))

    margin = max(20, int(w * 0.025))
    position = (w - logo_w - margin, h - logo_h - margin)

    base.paste(logo, position, logo)

    rgb_image = base.convert("RGB")
    rgb_image.save(output_path, quality=95)
