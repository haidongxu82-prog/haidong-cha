from __future__ import annotations

from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).resolve().parent


def load_sku_base() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "sku_base.csv")


def get_sku(sku_id: str) -> dict:
    df = load_sku_base()
    row = df[df["sku_id"] == sku_id]
    if row.empty:
        raise KeyError(f"SKU not found: {sku_id}")
    return row.iloc[0].to_dict()
