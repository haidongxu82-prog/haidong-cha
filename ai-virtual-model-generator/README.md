# 电商AI虚拟模特图生成系统 MVP

Controlled virtual model image generation system for ecommerce SKU images.

## Core principle

This is not a free generative image system. It is a controlled generation pipeline:

- fixed model identities
- fixed scene templates
- fixed pose templates
- product design preservation constraints
- QA gate
- manual review before publishing

## MVP scope

- Single SKU input
- Category router
- Template selector
- Prompt generation for image-to-image / virtual try-on API
- Mock generation output for local testing
- QA scoring: color, structure, CLIP-like similarity, face consistency, background template
- Review queue: pending / approved / rejected / regenerated
- Output module stubs: OSS/CDN/ecommerce update
- FastAPI endpoint
- n8n workflow skeleton

## Run

```bash
pip install -r requirements.txt
python pipeline/run_virtual_model.py
```

Outputs:

- `output/generation_result.json`
- `output/review_queue.json`

## API

```bash
uvicorn app.api.main:app --reload
```

Endpoint:

```text
POST /generate/model-image
```
