# Inventory Smart Replenishment System

Smart inventory replenishment MVP.

## What it does

- Aggregate 14-day sales
- Calculate available stock and days cover
- Detect stockout risk
- Generate replenishment suggestions
- Create draft purchase orders
- Export structured JSON
- Provide FastAPI endpoints for n8n
- Provide PostgreSQL schema and n8n workflow skeleton

## Run local MVP

```bash
pip install -r requirements.txt
python pipeline/run_replenishment.py
```

Outputs:

- `output/replenishment_suggestions.json`
- `output/purchase_orders.json`

## API

```bash
uvicorn app.api.main:app --reload
```

Endpoints:

- `GET /replenishment/run`
- `POST /purchase/create`

The system only creates suggestions and draft purchase orders. It does not submit orders to suppliers automatically.
