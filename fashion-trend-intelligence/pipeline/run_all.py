import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from modules.ai_tagger import tag_products
from modules.etl import standardize_products
from modules.io_utils import load_config, read_products
from modules.report_generator import write_outputs
from modules.scoring import score_products
from modules.trend_engine import trend_analysis


def run():
    config = load_config()
    raw = read_products()
    standardized = standardize_products(raw)
    tagged = tag_products(standardized)
    scored = score_products(tagged, config)
    trend = trend_analysis(scored)
    return write_outputs(scored, trend, config)


if __name__ == "__main__":
    print(run())
