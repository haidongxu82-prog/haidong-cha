# 竞品与新兴店铺自动发现系统 V1

This project implements an ecommerce emerging-brand and competitor discovery MVP.

## What it does

- Ingest mock/manual/API-like store ranking data
- Clean and normalize store fields
- Calculate Growth Score 0-100
- Classify competitors as S/A/B/C
- Generate strict JSON AI-style analysis
- Trigger alerts for growth, ad, social, and new-brand signals
- Persist results into SQLite
- Export JSON report
- Provide FastAPI endpoints and n8n workflow skeleton

Data can be mock in V1, but the schema is fixed.

## Run

```bash
pip install -r requirements.txt
python pipeline/run_discovery.py
```

Outputs:

- `output/discovery_report.json`
- `output/emerging_competitors.db`

## API

```bash
uvicorn api.discovery_api:app --reload
```

Endpoints:

- `POST /ingest`
- `POST /analyze`
- `GET /competitors`
- `GET /alerts`
