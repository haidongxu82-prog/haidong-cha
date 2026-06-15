from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from main import run_visual_mining


class AnalysisScope(BaseModel):
    include_homepage: bool = True
    include_product_detail: bool = True
    include_main_images: bool = True


class VisualMiningRequest(BaseModel):
    platform: str
    category: str
    competitor_urls: list[str] = Field(min_length=1)
    top_n_products: int = 20
    analysis_scope: AnalysisScope
    output_language: str = "zh"


app = FastAPI(title="Ecommerce Visual Mining API", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/ecommerce-visual-mining/run")
def run(request: VisualMiningRequest) -> dict:
    try:
        return run_visual_mining(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
