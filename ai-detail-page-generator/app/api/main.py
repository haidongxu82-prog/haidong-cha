from __future__ import annotations

from fastapi import FastAPI, HTTPException

from app.core.service import generate_detail_page


app = FastAPI(title="AI Detail Page Generator", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/detail-page/generate")
def generate(product: dict) -> dict:
    try:
        return generate_detail_page(product)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
