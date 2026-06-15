import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from pipeline.run_competitor_analysis import run as run_competitor_analysis
from pipeline.run_market_analysis import run as run_market_analysis


def run():
    return {
        "market": run_market_analysis(),
        "competitor": run_competitor_analysis(),
    }


if __name__ == "__main__":
    print(run())
