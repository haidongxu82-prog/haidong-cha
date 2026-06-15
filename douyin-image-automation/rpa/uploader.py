import logging
import random
import time

from config.settings import PROCESSED_DIR, UPLOAD_DELAY_MAX_SECONDS, UPLOAD_DELAY_MIN_SECONDS


def upload_to_douyin(product_id, file_path):
    """
    TODO: Implement Selenium upload steps for Douyin shop product edit page.

    Keep this function single-threaded. Do not parallel upload.
    """
    logging.info("product_id=%s upload placeholder file=%s", product_id, file_path)
    return True


def upload_images(product_id, images):
    for image in sorted(images, key=lambda item: item["index"]):
        index = image["index"]
        file_path = PROCESSED_DIR / product_id / f"{index}.jpg"
        logging.info("product_id=%s upload start index=%s", product_id, index)
        upload_to_douyin(product_id, file_path)
        logging.info("product_id=%s upload success index=%s", product_id, index)
        time.sleep(random.uniform(UPLOAD_DELAY_MIN_SECONDS, UPLOAD_DELAY_MAX_SECONDS))
