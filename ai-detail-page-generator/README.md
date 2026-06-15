# 电商AI详情页生成系统 MVP

This project builds a women-fashion ecommerce detail-page generator.

## MVP scope

- Parse structured product JSON
- Generate title options
- Generate selling points, fabric text, fit analysis, scene blocks, and detail-page sections
- Enforce risk controls:
  - no fabric fabrication
  - no functional claims not in input
  - no price/stock changes
  - no auto-generated size data
- Render HTML detail page
- Export structured JSON and HTML
- Provide FastAPI endpoint and n8n workflow skeleton
- Provide image processing module interface for 1000x1000 JPG/WebP output

## Run

```bash
pip install -r requirements.txt
python pipeline/run_detail_page.py
```

Outputs:

- `output/detail_page.json`
- `output/detail_page.html`

## API

```bash
uvicorn app.api.main:app --reload
```

Endpoint:

```text
POST /detail-page/generate
```
