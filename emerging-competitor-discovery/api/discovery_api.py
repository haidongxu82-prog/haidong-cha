from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from core_ai_engine.analyzer import analyze_store
from data_cleaning.cleaner import clean_records
from data_ingestion.ingest import ingest_records
from pipeline.run_discovery import DB_PATH, run
from storage.sqlite_store import connect, fetch_alerts, fetch_competitors


class IngestRequest(BaseModel):
    records: list[dict]


class AnalyzeRequest(BaseModel):
    record: dict


app = FastAPI(title="Emerging Competitor Discovery API", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/ingest")
def ingest(request: IngestRequest) -> dict:
    return run(request.records)


@app.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    cleaned = clean_records([request.record])
    if not cleaned:
        return {"error": "invalid record"}
    return analyze_store(cleaned[0])


@app.get("/competitors")
def competitors() -> list[dict]:
    conn = connect(DB_PATH)
    try:
        return fetch_competitors(conn)
    finally:
        conn.close()


@app.get("/alerts")
def alerts() -> list[dict]:
    conn = connect(DB_PATH)
    try:
        return fetch_alerts(conn)
    finally:
        conn.close()
