# Launch Conversion Analysis

电商上新成款率分析系统 MVP。

## Run

```bash
pip install -r requirements.txt
python pipeline/run_monthly_report.py --month 2026-06
```

## Input

```text
data/core_product_launch.csv
data/product_performance.csv
data/market_benchmark.csv
```

## Output

```text
output/launch_conversion_report.xlsx
output/monthly_analysis.json
output/monthly_report.md
schema/schema.sql
```

## Metric

成款率 = 有成交的上新款数 / 总上新款数

MVP 口径：`orders > 0` 即成款。
