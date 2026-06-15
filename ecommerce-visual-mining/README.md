# 电商视觉分析 & 爆款挖掘 MVP

This project implements an ecommerce competitor visual analysis and hot-product mining MVP.

## MVP scope

- Input platform, category, competitor shop URLs, and analysis scope
- Crawl/fallback competitor shop data
- Identify hot products by sales, engagement, visual clarity, and repetition
- Analyze visual style for main images, homepage, and detail pages
- Summarize winning visual patterns
- Generate executable visual optimization plan
- Export JSON and Markdown reports
- Provide FastAPI endpoint and n8n workflow skeleton

The crawler layer is designed as a replaceable adapter. Current MVP uses deterministic fallback data when platform APIs/RPA are not connected.

## Run

```bash
pip install -r requirements.txt
python main.py
```

Output:

- `output/visual_mining_report.json`
- `output/visual_mining_report.md`

## API

```bash
uvicorn api.visual_mining_api:app --reload
```

Endpoint:

```text
POST /api/ecommerce-visual-mining/run
```
