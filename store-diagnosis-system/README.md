# 电商店铺诊断系统 MVP

This project implements a store diagnosis MVP for ecommerce operations.

## MVP scope

- Product A/B/C segmentation
- Pricing risk and competitor price gap analysis
- Ads ROI status analysis
- Visual/conversion anomaly detection from CTR and CVR benchmarks
- Structured JSON output
- Markdown report output
- FastAPI endpoint skeleton
- n8n workflow skeleton

## Run

```bash
pip install -r requirements.txt
python pipeline/run_store_diagnosis.py
```

Outputs:

- `output/store_diagnosis.json`
- `output/store_diagnosis.md`
- `output/store_diagnosis.xlsx`

## API

```bash
uvicorn api.store_diagnosis_api:app --reload
```

Endpoint:

```text
POST /api/store-diagnosis/run
```

The system only gives operation suggestions. It does not automatically change prices or pause ads.
