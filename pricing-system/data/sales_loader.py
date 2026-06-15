from __future__ import annotations

from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).resolve().parent


def load_sales() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "sales_data.csv")


def get_sales(sku_id: str) -> dict | None:
    df = load_sales()
    row = df[df["sku_id"] == sku_id]
    if row.empty:
        return None
    return row.iloc[0].to_dict()
