from __future__ import annotations

from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"


def load_product_sku() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "product_sku.csv")


def load_inventory_stock() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "inventory_stock.csv")


def load_sales_daily() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "sales_daily.csv", parse_dates=["sale_date"])


def aggregate_current_stock(stock: pd.DataFrame) -> pd.DataFrame:
    df = stock.copy()
    df["current_stock"] = df["available_qty"] - df["locked_qty"]
    return df.groupby("sku_id", as_index=False).agg(current_stock=("current_stock", "sum"))


def sales_trend_by_sku(sales: pd.DataFrame) -> dict[str, list[int]]:
    latest_dates = sorted(sales["sale_date"].dt.date.unique())[-14:]
    recent = sales[sales["sale_date"].dt.date.isin(latest_dates)]
    grouped = recent.groupby(["sku_id", "sale_date"], as_index=False).agg(sale_qty=("sale_qty", "sum"))
    result: dict[str, list[int]] = {}
    for sku_id, part in grouped.groupby("sku_id"):
        result[str(sku_id)] = [int(x) for x in part.sort_values("sale_date")["sale_qty"].tolist()]
    return result
