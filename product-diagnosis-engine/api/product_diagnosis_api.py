from __future__ import annotations

import sys
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from main import run_product_diagnosis


class ProductDiagnosisRequest(BaseModel):
    product_name: str
    category: str
    cost_price: float = Field(gt=0)
    selling_price: float = Field(gt=0)
    platform: Literal["taobao", "douyin", "pdd", "shopify"]
    target_market: str
    optional_keywords: list[str] = []


app = FastAPI(title="Product Diagnosis Engine", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/product-diagnosis/run")
def diagnose(request: ProductDiagnosisRequest) -> dict:
    try:
        return run_product_diagnosis(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
