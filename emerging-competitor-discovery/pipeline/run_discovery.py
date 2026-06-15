from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from alert_engine.alerts import detect_alerts
from core_ai_engine.analyzer import analyze_store
from data_cleaning.cleaner import clean_records
from data_ingestion.ingest import ingest_records
from storage.sqlite_store import connect, save_results


OUTPUT_DIR = PROJECT_DIR / "output"
DB_PATH = OUTPUT_DIR / "emerging_competitors.db"


def run(records: list[dict] | None = None) -> dict:
    raw = ingest_records(records)
    cleaned = clean_records(raw)
    results = []
    all_alerts = []
    for record in cleaned:
        analysis = analyze_store(record)
        alerts = detect_alerts(record, analysis)
        all_alerts.extend(alerts)
        results.append({
            "record": record,
            "analysis": analysis,
            "alerts": alerts,
        })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = connect(DB_PATH)
    save_results(conn, results, all_alerts)
    conn.close()

    payload = {
        "summary": {
            "store_count": len(results),
            "competitor_count": sum(1 for item in results if item["analysis"]["is_competitor"]),
            "new_brand_count": sum(1 for item in results if item["analysis"]["is_new_brand"]),
            "alert_count": len(all_alerts),
        },
        "results": results,
        "alerts": all_alerts,
    }
    report_path = OUTPUT_DIR / "discovery_report.json"
    report_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "report": str(report_path),
        "database": str(DB_PATH),
    }


if __name__ == "__main__":
    print(run())
