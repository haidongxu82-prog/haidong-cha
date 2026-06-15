from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "process.log"
LOGO_PATH = BASE_DIR / "config" / "logo.png"

RETRY_TIMES = 2
REQUEST_TIMEOUT = 30
UPLOAD_DELAY_MIN_SECONDS = 3
UPLOAD_DELAY_MAX_SECONDS = 8

SELENIUM_HEADLESS = False
DOUYIN_SHOP_URL = "https://fxg.jinritemai.com/"
