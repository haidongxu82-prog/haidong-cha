import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from modules.ai_analysis import build_ai_analysis
from modules.benchmark import attach_benchmark, benchmark_insights
from modules.io_utils import load_config, read_csv
from modules.metrics import build_product_fact, conversion_summary, group_summary
from modules.report_generator import build_report_payload, write_outputs


def run(month):
    launch = read_csv("core_product_launch.csv")
    perf = read_csv("product_performance.csv")
    benchmark = read_csv("market_benchmark.csv")

    fact = build_product_fact(launch, perf, month)
    overall = conversion_summary(fact)
    style_summary = group_summary(fact, ["category", "style_tag"])
    member_summary = group_summary(fact, ["team_member"])
    benchmarked = attach_benchmark(style_summary, benchmark)
    insights = benchmark_insights(benchmarked)
    ai_analysis = build_ai_analysis(benchmarked)
    payload = build_report_payload(
        month,
        fact,
        overall,
        style_summary,
        member_summary,
        benchmarked,
        insights,
        ai_analysis,
    )
    return write_outputs(payload, fact, style_summary, member_summary, benchmarked)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--month", default=load_config().get("report_month", "2026-06"))
    args = parser.parse_args()
    print(run(args.month))


if __name__ == "__main__":
    main()
