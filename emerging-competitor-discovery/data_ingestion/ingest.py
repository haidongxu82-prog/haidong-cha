from __future__ import annotations

import json
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]


def load_mock_sources() -> list[dict]:
    return json.loads((ROOT_DIR / "data" / "sample_stores.json").read_text(encoding="utf-8"))


def ingest_records(records: list[dict] | None = None) -> list[dict]:
    return records if records is not None else load_mock_sources()
