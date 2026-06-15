# 电商数据自动化系统 MVP

This project implements a local MVP for ecommerce launch metrics, payment-rate tracking, and product-link health diagnosis.

## What it does

- Daily new product count
- Daily and period payment rate
- Product health score
- Anomaly detection for low CTR, zero conversion, high exposure with low clicks, and high clicks with no payment
- Diagnosis report output as JSON, Excel, and Markdown
- SQL schema and n8n workflow skeleton for deployment handoff

## Structure

```text
ecommerce-data-automation/
├── config.json
├── data/
│   ├── product_launch.csv
│   ├── product_metrics_daily.csv
│   └── order_fact.csv
├── modules/
│   ├── ai_explain.py
│   ├── diagnosis.py
│   ├── io_utils.py
│   ├── metrics.py
│   └── report.py
├── n8n/
│   └── ecommerce-data-automation.workflow.json
├── output/
├── pipeline/
│   └── run_daily_report.py
├── schema/
│   └── schema.sql
└── requirements.txt
```

## Run

```bash
pip install -r requirements.txt
python pipeline/run_daily_report.py --start-date 2026-06-01 --end-date 2026-06-15
```

Outputs:

- `output/ecommerce_automation_report.xlsx`
- `output/diagnosis_report.json`
- `output/daily_report.md`

## Metric definitions

- `payment_rate = paid_orders / orders`
- `ctr = clicks / impressions`
- `conversion_rate = paid_orders / clicks`
- `health_score = weighted CTR + weighted conversion_rate + weighted paid_amount`

AI is used only as an explanation layer. Statistical facts come from SQL/Python metrics.
