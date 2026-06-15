# 竞店自动分析系统 MVP

This project implements a competitor intelligence MVP for ecommerce shops.

## MVP scope

- Collect competitor shop SKU data with platform adapters and fallback mock data
- Normalize SKU data
- Classify SKU type: 爆款 / 引流款 / 利润款 / 测试款
- Analyze shop structure, price bands, hot ratio, and publish frequency
- Generate rule-based LLM-style competitor strategy report
- Output daily and weekly Markdown reports
- Provide SQL schema and n8n workflow skeleton

Correct path:

1. Rule analysis first
2. AI summary second

## Run

```bash
pip install -r requirements.txt
python main.py
```

Outputs:

- `output/daily_report.md`
- `output/weekly_report.md`
- `output/report.json`

## Structure

Matches the requested engineering structure:

```text
competitor-intelligence-system/
├── collector/
├── processor/
├── analyzer/
├── ai/
├── workflows/
├── storage/
├── output/
├── config/
├── main.py
└── requirements.txt
```
