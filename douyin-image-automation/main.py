import logging
import time
from pathlib import Path

from config.settings import LOG_DIR, LOG_FILE, LOGO_PATH, PROCESSED_DIR, RAW_DIR, RETRY_TIMES
from processor.logo_adder import add_logo
from processor.validator import validate_image
from rpa.downloader import download_images
from rpa.scraper import get_product_list
from rpa.uploader import upload_images


def setup_logging():
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="[%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


def retry(task_name, fn, *args, **kwargs):
    last_error = None
    for attempt in range(RETRY_TIMES + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as error:
            last_error = error
            if attempt < RETRY_TIMES:
                logging.error("%s retry %s failed: %s", task_name, attempt + 1, error)
                time.sleep(1 + attempt)
            else:
                logging.error("%s failed after retries: %s", task_name, error)
    raise last_error


def process_product(product_id, images):
    if not Path(LOGO_PATH).exists():
        raise FileNotFoundError(f"missing logo file: {LOGO_PATH}")

    for image in sorted(images, key=lambda item: item["index"]):
        index = image["index"]
        input_file = RAW_DIR / product_id / f"{index}.jpg"
        output_file = PROCESSED_DIR / product_id / f"{index}.jpg"

        logging.info("product_id=%s image process start index=%s", product_id, index)
        validate_image(input_file)
        add_logo(input_file, LOGO_PATH, output_file)
        validate_image(output_file)
        logging.info("product_id=%s image processed index=%s", product_id, index)


def main():
    setup_logging()
    products = get_product_list()

    for product in products:
        product_id = product["product_id"]
        logging.info("product_id=%s start processing", product_id)
        retry("download_images", download_images, product)
        retry("process_product", process_product, product_id, product["images"])
        retry("upload_images", upload_images, product_id, product["images"])
        logging.info("product_id=%s processing complete", product_id)


if __name__ == "__main__":
    main()
