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
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def read_csv(name: str, parse_dates: list[str] | None = None) -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / name, parse_dates=parse_dates)


def ensure_output_dir() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR


def write_json(payload: dict[str, Any], filename: str) -> Path:
    output_dir = ensure_output_dir()
    path = output_dir / filename
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return path
