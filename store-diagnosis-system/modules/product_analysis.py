from __future__ import annotations

import pandas as pd


def segment_products(products: pd.DataFrame, top_percentile: float = 0.8) -> pd.DataFrame:
    df = products.copy()
    p80 = df["sales_30d"].quantile(top_percentile)
    avg_cv = df["conversion_rate"].mean()

    def classify(row: pd.Series) -> str:
        if row["sales_30d"] > p80 and row["conversion_rate"] > avg_cv:
            return "A"
        if row["conversion_rate"] > avg_cv:
            return "B"
        return "C"

    df["product_layer"] = df.apply(classify, axis=1)
    df["product_layer_reason"] = df.apply(
        lambda row: build_layer_reason(row, p80, avg_cv),
        axis=1,
    )
    return df


def build_layer_reason(row: pd.Series, p80: float, avg_cv: float) -> str:
    if row["product_layer"] == "A":
        return f"30日销量高于Top20%阈值{p80:.0f}，且转化率高于均值{avg_cv:.2%}"
    if row["product_layer"] == "B":
        return f"转化率高于均值{avg_cv:.2%}，但销量未进入Top20%"
    return f"销量或转化率低于店铺均值，需重点诊断"


def product_layer_summary(segmented: pd.DataFrame) -> pd.DataFrame:
    summary = segmented.groupby("product_layer", as_index=False).agg(
        sku_count=("sku", "count"),
        sales_30d=("sales_30d", "sum"),
        avg_conversion_rate=("conversion_rate", "mean"),
        avg_ctr=("ctr", "mean"),
    )
    summary["avg_conversion_rate"] = summary["avg_conversion_rate"].round(4)
    summary["avg_ctr"] = summary["avg_ctr"].round(4)
    return summary
