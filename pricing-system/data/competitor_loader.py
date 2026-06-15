from __future__ import annotations

from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).resolve().parent


def load_competitors() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "competitor_prices.csv")


def get_competitors(sku_id: str) -> list[dict]:
    df = load_competitors()
    rows = df[df["sku_id"] == sku_id]
    if rows.empty:
        raise KeyError(f"Competitors not found: {sku_id}")
    return rows[["competitor_name", "price"]].to_dict(orient="records")
