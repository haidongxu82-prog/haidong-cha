import logging
from pathlib import Path

import requests

from config.settings import RAW_DIR, REQUEST_TIMEOUT


def download_image(url, output_path):
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    response = requests.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    output_path.write_bytes(response.content)
    return output_path


def download_images(product):
    product_id = product["product_id"]
    images = sorted(product["images"], key=lambda item: item["index"])
    product_dir = RAW_DIR / product_id
    product_dir.mkdir(parents=True, exist_ok=True)

    for image in images:
        index = image["index"]
        output_path = product_dir / f"{index}.jpg"
        logging.info("product_id=%s download start index=%s", product_id, index)
        download_image(image["url"], output_path)
        logging.info("product_id=%s download complete index=%s", product_id, index)
