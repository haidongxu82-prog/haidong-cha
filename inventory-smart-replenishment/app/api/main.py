from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.core.service import run_replenishment


ROOT_DIR = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT_DIR / "output"


class PurchaseCreateRequest(BaseModel):
    sku_id: str
    qty: int = Field(gt=0)
    supplier_id: str


app = FastAPI(title="Inventory Smart Replenishment System", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/replenishment/run")
def replenishment_run() -> list[dict]:
    return run_replenishment()


@app.post("/purchase/create")
def purchase_create(request: PurchaseCreateRequest) -> dict:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / "purchase_orders.json"
    existing = []
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))
    po = {
        "po_id": len(existing) + 1,
        "sku_id": request.sku_id,
        "qty": request.qty,
        "supplier_id": request.supplier_id,
        "status": "draft",
    }
    existing.append(po)
    path.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    return po
