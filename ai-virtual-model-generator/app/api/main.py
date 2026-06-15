from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.core_service import run_generation_pipeline


ROOT_DIR = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT_DIR / "output"


class GenerateRequest(BaseModel):
    sku_id: str
    template_id: str | None = None


app = FastAPI(title="AI Virtual Model Generator", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/generate/model-image")
def generate_model_image_api(request: GenerateRequest) -> dict:
    sample_path = ROOT_DIR / "data" / "sample_sku.json"
    sku = json.loads(sample_path.read_text(encoding="utf-8"))
    sku["sku_id"] = request.sku_id
    try:
        result = run_generation_pipeline(sku, request.template_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "latest_api_result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "status": result["status"],
        "image_url": result["generated"]["image_url"],
        "qa_score": result["qa"]["qa_score"],
        "review_status": result["review"]["status"],
    }
