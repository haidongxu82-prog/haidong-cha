from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from core.service import build_pricing_suggestion


app = FastAPI(title="Ecommerce Pricing Suggestion API", version="0.1.0")


class PricingRequest(BaseModel):
    sku_id: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/pricing/suggest")
def suggest(request: PricingRequest) -> dict:
    try:
        return build_pricing_suggestion(request.sku_id)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
