import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from modules.classification import classify_market_data
from modules.io_utils import DATA_DIR, load_config, read_table
from modules.market_analysis import build_market_analysis
from modules.report_generator import write_market_report


def run():
    config = load_config()
    market_df = read_table(DATA_DIR / "market_data.csv")
    classified = classify_market_data(market_df, config)
    analysis = build_market_analysis(classified)
    return write_market_report(analysis)


if __name__ == "__main__":
    print(run())
