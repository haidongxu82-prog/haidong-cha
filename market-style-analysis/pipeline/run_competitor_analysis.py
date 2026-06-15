import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from modules.classification import classify_market_data
from modules.competitor_matching import match_competitors
from modules.io_utils import DATA_DIR, load_config, read_table
from modules.market_analysis import ensure_gmv
from modules.report_generator import write_competitor_report


def run():
    config = load_config()
    market_df = read_table(DATA_DIR / "market_data.csv")
    sku_df = read_table(DATA_DIR / "sku_data.csv")
    classified_market = ensure_gmv(classify_market_data(market_df, config))
    sku_classified, competitor_analysis = match_competitors(classified_market, sku_df, config)
    return write_competitor_report(sku_classified, competitor_analysis)


if __name__ == "__main__":
    print(run())
