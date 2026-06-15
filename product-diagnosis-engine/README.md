# 电商商品诊断系统 MVP

This project implements an ecommerce product diagnosis engine.

## MVP scope

- Input product information
- Fetch or fallback to mock competitor data
- Estimate profit range
- Analyze market competition and price band
- Score product competitiveness
- Generate decision and operation strategy
- Export structured JSON report
- Provide FastAPI endpoint and n8n workflow skeleton

The system only outputs decisions and suggestions. It does not place orders, change prices, or publish ads.

## Run

```bash
pip install -r requirements.txt
python main.py
```

Output:

- `output/report.json`

## API

```bash
uvicorn api.product_diagnosis_api:app --reload
```

Endpoint:

```text
POST /api/product-diagnosis/run
```

## Project structure

```text
product-diagnosis-engine/
├── api/
├── data/
├── modules/
├── n8n/
├── output/
├── services/
├── utils/
├── config.py
└── main.py
```
