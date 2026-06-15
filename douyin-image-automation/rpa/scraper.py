from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from config.settings import DOUYIN_SHOP_URL, SELENIUM_HEADLESS


def build_driver():
    options = Options()
    if SELENIUM_HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--disable-blink-features=AutomationControlled")
    return webdriver.Chrome(options=options)


def get_product_list():
    """
    TODO: Replace demo data with real Douyin shop scraping.

    Expected output:
    [
      {
        "product_id": "12345",
        "title": "商品A",
        "images": [{"url": "https://...", "index": 1}]
      }
    ]
    """
    return [
        {
            "product_id": "demo_001",
            "title": "示例商品",
            "images": [
                {
                    "url": "https://via.placeholder.com/1200x1200.jpg?text=product-1",
                    "index": 1,
                },
                {
                    "url": "https://via.placeholder.com/1200x1200.jpg?text=product-2",
                    "index": 2,
                },
            ],
        }
    ]


def open_douyin_shop_login():
    driver = build_driver()
    driver.get(DOUYIN_SHOP_URL)
    return driver
