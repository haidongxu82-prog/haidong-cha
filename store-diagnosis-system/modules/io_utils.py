from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
OUTPUT_DIR = ROOT_DIR / "output"
CONFIG_PATH = ROOT_DIR / "config.json"


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def load_input_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    products = pd.read_csv(DATA_DIR / "products.csv")
    ads = pd.read_csv(DATA_DIR / "ads.csv")
    competitors = pd.read_csv(DATA_DIR / "competitors.csv")
    return products, ads, competitors


def ensure_output_dir() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR


def write_json(payload: dict[str, Any], filename: str) -> Path:
    path = ensure_output_dir() / filename
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path
