# 电商智能定价系统 MVP

This project implements a pricing recommendation MVP based on cost, competitor prices, and sales data.

## What it does

- Load SKU, competitor, and optional sales data from CSV
- Filter competitor price outliers with P5/P95 clipping
- Validate cost price
- Calculate market price range
- Calculate minimum price by margin constraint
- Suggest main price, low/mid/high price band, and promotion price
- Generate rule-based AI-style pricing explanation
- Export JSON and Excel reports
- Provide a FastAPI endpoint skeleton
- Provide n8n workflow skeleton

The system only gives pricing suggestions. It does not change prices automatically.

## Run local MVP

```bash
pip install -r requirements.txt
python pipeline/run_pricing_report.py
```

Outputs:

- `output/pricing_report.json`
- `output/pricing_report.xlsx`

## API

```bash
uvicorn api.pricing_api:app --reload
```

Endpoint:

```text
POST /api/pricing/suggest
```

Request:

```json
{"sku_id": "SKU1001"}
```

## Directory

```text
pricing-system/
├── ai/
├── api/
├── config/
├── core/
├── data/
├── n8n/
├── output/
├── pipeline/
└── schema/
```
