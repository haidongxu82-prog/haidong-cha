from __future__ import annotations

import math

import pandas as pd


def prepare_metrics(metrics: pd.DataFrame) -> pd.DataFrame:
    df = metrics.copy()
    df["ctr"] = df["ctr"].fillna(df["clicks"] / df["impressions"].replace(0, pd.NA)).fillna(0)
    df["conversion_rate"] = (
        df["conversion_rate"]
        .fillna(df["paid_orders"] / df["clicks"].replace(0, pd.NA))
        .fillna(0)
    )
    df["payment_rate"] = (df["paid_orders"] / df["orders"].replace(0, pd.NA)).fillna(0)
    return df


def filter_period(metrics: pd.DataFrame, start_date: str, end_date: str) -> pd.DataFrame:
    df = metrics.copy()
    df["stat_date"] = pd.to_datetime(df["stat_date"])
    return df[(df["stat_date"] >= start_date) & (df["stat_date"] <= end_date)]


def aggregate_sku_metrics(metrics: pd.DataFrame) -> pd.DataFrame:
    grouped = metrics.groupby("sku", as_index=False).agg(
        impressions=("impressions", "sum"),
        clicks=("clicks", "sum"),
        orders=("orders", "sum"),
        paid_orders=("paid_orders", "sum"),
        paid_amount=("paid_amount", "sum"),
    )
    grouped["ctr"] = (grouped["clicks"] / grouped["impressions"].replace(0, pd.NA)).fillna(0)
    grouped["conversion_rate"] = (grouped["paid_orders"] / grouped["clicks"].replace(0, pd.NA)).fillna(0)
    grouped["payment_rate"] = (grouped["paid_orders"] / grouped["orders"].replace(0, pd.NA)).fillna(0)
    return grouped


def build_product_fact(launch: pd.DataFrame, metrics: pd.DataFrame) -> pd.DataFrame:
    sku_metrics = aggregate_sku_metrics(metrics)
    fact = launch.merge(sku_metrics, on="sku", how="left")
    numeric_cols = ["impressions", "clicks", "orders", "paid_orders", "paid_amount", "ctr", "conversion_rate", "payment_rate"]
    for col in numeric_cols:
        fact[col] = fact[col].fillna(0)
    return fact


def daily_new_products(launch: pd.DataFrame) -> pd.DataFrame:
    df = launch.copy()
    df["date"] = pd.to_datetime(df["launch_time"]).dt.date.astype(str)
    return df.groupby("date", as_index=False).agg(new_products=("sku", "count"))


def daily_payment_rate(metrics: pd.DataFrame) -> pd.DataFrame:
    df = metrics.groupby("stat_date", as_index=False).agg(
        orders=("orders", "sum"),
        paid_orders=("paid_orders", "sum"),
        paid_amount=("paid_amount", "sum"),
    )
    df["payment_rate"] = (df["paid_orders"] / df["orders"].replace(0, pd.NA)).fillna(0)
    df["stat_date"] = pd.to_datetime(df["stat_date"]).dt.date.astype(str)
    return df


def calculate_health_score(fact: pd.DataFrame, config: dict) -> pd.DataFrame:
    df = fact.copy()
    weights = config["health_score"]["weights"]
    targets = config["health_score"]["normalization"]

    ctr_score = (df["ctr"] / targets["ctr_target"]).clip(0, 1)
    conversion_score = (df["conversion_rate"] / targets["conversion_rate_target"]).clip(0, 1)
    paid_target = math.log(targets["paid_amount_target"] + 1)
    paid_score = df["paid_amount"].apply(lambda x: min(math.log(x + 1) / paid_target, 1))

    df["health_score"] = (
        weights["ctr"] * ctr_score
        + weights["conversion_rate"] * conversion_score
        + weights["paid_amount"] * paid_score
    ) * 100
    df["health_score"] = df["health_score"].round(2)
    return df


def category_summary(fact: pd.DataFrame) -> pd.DataFrame:
    grouped = fact.groupby("category", as_index=False).agg(
        products=("sku", "nunique"),
        impressions=("impressions", "sum"),
        clicks=("clicks", "sum"),
        orders=("orders", "sum"),
        paid_orders=("paid_orders", "sum"),
        paid_amount=("paid_amount", "sum"),
        avg_health_score=("health_score", "mean"),
    )
    grouped["ctr"] = (grouped["clicks"] / grouped["impressions"].replace(0, pd.NA)).fillna(0)
    grouped["conversion_rate"] = (grouped["paid_orders"] / grouped["clicks"].replace(0, pd.NA)).fillna(0)
    grouped["payment_rate"] = (grouped["paid_orders"] / grouped["orders"].replace(0, pd.NA)).fillna(0)
    grouped["avg_health_score"] = grouped["avg_health_score"].round(2)
    return grouped
