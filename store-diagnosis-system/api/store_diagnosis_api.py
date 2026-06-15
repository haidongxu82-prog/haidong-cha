from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from pipeline.run_store_diagnosis import run


app = FastAPI(title="Store Diagnosis System", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/store-diagnosis/run")
def run_store_diagnosis() -> dict:
    return run()
