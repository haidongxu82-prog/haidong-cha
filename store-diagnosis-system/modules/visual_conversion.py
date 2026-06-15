from __future__ import annotations

import pandas as pd


def detect_visual_conversion_issues(products: pd.DataFrame, config: dict) -> pd.DataFrame:
    df = products[["sku", "ctr", "conversion_rate"]].copy()
    industry_ctr = config["benchmarks"]["industry_ctr"]
    industry_cv = config["benchmarks"]["industry_conversion_rate"]

    def issues(row: pd.Series) -> list[str]:
        result = []
        if row["ctr"] < industry_ctr * 0.7:
            result.append("主图/视觉问题")
        if row["conversion_rate"] < industry_cv * 0.7:
            result.append("详情页/价格问题")
        return result

    df["visual_conversion_issues"] = df.apply(issues, axis=1)
    return df
